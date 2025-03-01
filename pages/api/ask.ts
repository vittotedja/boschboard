// src/pages/api/rag/ask.ts
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from 'zod';
import type { NextApiRequest, NextApiResponse } from 'next';

// Zod schema for structured output
const ContextSchema = z.object({
  tools: z.array(z.string()).optional(),
  products: z.array(z.string()).optional(),
  date_range: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional(),
  error_threshold: z.number().optional(),
  question_type: z.union([
    z.literal('calibration_schedule'),
    z.literal('tool_performance'),
    z.literal('measurement_accuracy'),
    z.literal('compliance'),
    z.literal('product_quality'),
    z.literal('predictive')
  ])
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;
    
    // Step 1: Structured analysis with OpenAI
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: `Analyze calibration/measurement questions using these database tables:
        - measurement_records: prod_id, tool_id, measurement_mm, timestamp
        - calibration_records: Serial_or_id_no, last_calibration_date, Calibration_error
        - products: serial_id, tolerance_limit_mm
        - tools: Serial_or_id_no, Model_or_Part_No
        
        Extract:
        1. Tools (match Serial_or_id_no or Description)
        2. Products (match serial_id or description)
        3. Date ranges (convert relative dates to absolute)
        4. Error thresholds (compare to Calibration_error or tolerance_limit_mm)
        5. Question type:
           - calibration_schedule: Due dates, intervals
           - tool_performance: Error rates, accuracy
           - measurement_accuracy: Valid measurements
           - compliance: Policy adherence
           - product_quality: Product-specific measurements
           - predictive: Future calibration needs
           
        Return valid JSON matching the Context schema. Return empty object if no match.`
      }, {
        role: "user",
        content: question
      }],
      response_format: zodResponseFormat(ContextSchema, "context")
    });

    const context = JSON.parse(analysis.choices[0].message.content);
    const validatedContext = ContextSchema.parse(context);

    // Step 2: Dynamic data retrieval
    let data: any = {};

    switch(validatedContext.question_type) {
      case 'calibration_schedule':
        data = await handleCalibrationSchedule(validatedContext);
        break;
      case 'measurement_accuracy':
        data = await handleMeasurementAccuracy(validatedContext);
        break;
      case 'product_quality':
        data = await handleProductQuality(validatedContext);
        break;
      case 'tool_performance':
        data = await handleToolPerformance(validatedContext);
        break;
      case 'predictive':
        data = await handlePredictiveAnalysis(validatedContext);
        break;
      default:
        data = await handleGenericQuery(validatedContext);
    }

    // Step 3: Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: `You're a quality assurance expert. Analyze this data:
        ${JSON.stringify(data)}
        
        Consider:
        - Measurement vs tolerance limits
        - Calibration schedules
        - Error trends
        - Compliance requirements
        - Product specifications`
      }, {
        role: "user",
        content: question
      }]
    });

    return res.status(200).json({
      answer: response.choices[0].message.content,
      context: validatedContext,
      data: data
    });

  } catch (error) {
    console.error('RAG Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Query Handlers
async function handleCalibrationSchedule(context: z.infer<typeof ContextSchema>) {
  const query = supabase
    .from('calibration_records')
    .select('*, tools!inner(*)')
    .order('last_calibration_date', { ascending: false });
  
  if (context.tools?.length) {
    const { data: tools } = await supabase
      .from('tools')
      .select('Serial_or_Id_no')
      .in('Serial_or_Id_no', context.tools);
    query.in('Serial_or_Id_no', tools?.map(t => t.Serial_or_Id_no) || []);
  }
  const { data } = await query;
  return { calibrations: data };
}

async function handleMeasurementAccuracy(context: z.infer<typeof ContextSchema>) {
  let query = supabase
    .from('measurement_records')
    .select('*, products!inner(*), tools!inner(*)')
    .order('timestamp', { ascending: false });

  if (context.tools) {
    const { data: tools } = await supabase
      .from('tools')
      .select('Serial_or_id_no')
      .in('Description', context.tools);
    query.in('tool_id', tools?.map(t => t.Serial_or_id_no) || []);
  }

  if (context.products) {
    const { data: products } = await supabase
      .from('products')
      .select('serial_id')
      .in('description', context.products);
    query.in('prod_id', products?.map(p => p.serial_id) || []);
  }

  if (context.date_range) {
    query = query
      .gte('timestamp', context.date_range.start)
      .lte('timestamp', context.date_range.end);
  }

  if (context.error_threshold) {
    query = query.gte('measurement_mm', context.error_threshold);
  }

  const { data } = await query;
  return { measurements: data };
}

async function handleProductQuality(context: z.infer<typeof ContextSchema>) {
  const query = supabase
    .from('products')
    .select('*, measurement_records!inner(*)')
    .order('size_mm', { ascending: true });

  if (context.products) {
    query.in('serial_id', context.products);
  }

  if (context.error_threshold) {
    query.filter('measurement_records.measurement_mm', 'gte', context.error_threshold);
  }

  const { data } = await query;
  return { products: data };
}

async function handlePredictiveAnalysis(context: z.infer<typeof ContextSchema>) {
  const query = supabase
    .from('calibration_records')
    .select('*')
    .order('last_calibration_date', { ascending: true });

  if (context.tools) {
    query.in('Serial_or_id_no', context.tools);
  }

  const { data } = await query;
  return { calibration_history: data };
}

async function handleToolPerformance(context: z.infer<typeof ContextSchema>) {
  const query = supabase
    .from('tools')
    .select('*, calibration_records!inner(*), measurement_records!inner(*)')
    .order('Calibrator', { ascending: true });

  if (context.tools) {
    query.in('Serial_or_id_no', context.tools);
  }

  if (context.date_range) {
    query
      .gte('calibration_records.last_calibration_date', context.date_range.start)
      .lte('calibration_records.last_calibration_date', context.date_range.end);
  }

  if (context.error_threshold) {
    query.lte('calibration_records.Calibration_error', context.error_threshold);
  }

  const { data } = await query;
  return { 
    tools: data,
    related_calibrations: data?.flatMap(t => t.calibration_records),
    related_measurements: data?.flatMap(t => t.measurement_records)
  };
}

async function handleGenericQuery(context: z.infer<typeof ContextSchema>) {
  const queries = {
    tools: supabase.from('tools').select('*'),
    products: supabase.from('products').select('*'),
    calibrations: supabase.from('calibration_records').select('*'),
    measurements: supabase.from('measurement_records').select('*')
  };

  if (context.tools) {
    queries.tools = queries.tools.in('Serial_or_id_no', context.tools);
  }

  if (context.products) {
    queries.products = queries.products.in('serial_id', context.products);
  }

  if (context.date_range) {
    queries.calibrations = queries.calibrations
      .gte('last_calibration_date', context.date_range.start)
      .lte('last_calibration_date', context.date_range.end);
      
    queries.measurements = queries.measurements
      .gte('timestamp', context.date_range.start)
      .lte('timestamp', context.date_range.end);
  }

  const results = await Promise.all([
    queries.tools,
    queries.products,
    queries.calibrations,
    queries.measurements
  ]);

  return {
    tools: results[0].data,
    products: results[1].data,
    calibrations: results[2].data,
    measurements: results[3].data
  };
}