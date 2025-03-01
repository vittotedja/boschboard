import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { NextApiRequest, NextApiResponse } from 'next';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const Context = z.object({
  tools: z.array(z.string()),
  products:  z.array(z.string()),
  date_range: z.object({
    start: z.string(),
    end: z.string()
  }),
  error_threshold: z.number(),
  question_type: z.string()
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
    
    // Step 1: Analyze question with OpenAI
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `Analyze the calibration question. Identify:
        - Tool names/IDs
        - Product names/IDs
        - Date ranges
        - Error thresholds
        - Question type (calibration, measurement, compliance, etc.)`
      }, {
        role: "user",
        content: question
      }],
      response_format: zodResponseFormat(Context, "context")
    });
    const context = JSON.parse(analysis.choices[0].message.content);
    console.log('Context:');
    console.log(context);
    // Step 2: Query Supabase
    const data: any = {};

    // Tools query
    console.log(context.tools);
    if (context.tools) {
      const { data: tools } = await supabase
        .from('tools')
        .select('*')
        .in('name', context.tools);
      data.tools = tools;
    }
    console.log('Tools:');
    console.log(data.tools);

    // Calibration query
    const calibrationQuery = supabase
      .from('calibration_records')
      .select('*')
      .order('date', { ascending: false });

    if (context.tools) {
      calibrationQuery.in('tool_id', data.tools?.map((t: any) => t.id) || []);
    }

    const { data: calibrations } = await calibrationQuery;
    data.calibrations = calibrations;
    console.log('Calibrations:');
    console.log(data.calibrations);

    // Measurements query
    const measurementQuery = supabase
      .from('measurement_records')
      .select('*, product(*)')
      .order('date', { ascending: false });

    if (context.tools) {
      measurementQuery.in('tool_id', data.tools?.map((t: any) => t.id) || []);
    }

    if (context.products) {
      measurementQuery.in('product.name', context.products);
    }

    const { data: measurements } = await measurementQuery;
    data.measurements = measurements;
    console.log('Measurements:');
    console.log(data.measurements);

    // Step 3: Generate response
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `You're a calibration expert. Use this data to answer the question:
        ${JSON.stringify(data)}
        
        Consider:
        - Latest calibration dates
        - Measurement accuracy trends
        - Compliance requirements
        - Product specifications`
      }, {
        role: "user",
        content: question
      }]
    });

    res.status(200).json({
      answer: response.choices[0].message.content,
      context: data // Optional for debugging
    });

  } catch (error) {
    console.error('RAG Error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
}