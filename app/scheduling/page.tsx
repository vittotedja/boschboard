"use client"

import { useState } from "react"
import { Calendar, CheckCircle2, Clock, Download, Filter, MoreHorizontal, Plus, Search, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data for the timeline
const timelineData = [
  { id: 1, date: "Jan 2023", title: "Initial Calibration", status: "completed" },
  { id: 2, date: "Apr 2023", title: "Quarterly Check", status: "completed" },
  { id: 3, date: "Jul 2023", title: "Maintenance", status: "completed" },
  { id: 4, date: "Oct 2023", title: "Quarterly Check", status: "completed" },
  { id: 5, date: "Jan 2024", title: "Annual Calibration", status: "completed" },
  { id: 6, date: "Apr 2024", title: "Quarterly Check", status: "current" },
  { id: 7, date: "Jul 2024", title: "Scheduled Maintenance", status: "upcoming" },
  { id: 8, date: "Oct 2024", title: "Quarterly Check", status: "upcoming" },
]

// Sample data for the table
const tableData = [
  {
    id: "EQ-001",
    name: "Pressure Sensor A",
    department: "Production",
    lastCalibration: "Jan 15, 2024",
    calibrationDue: "Jul 15, 2024",
    status: "Active",
  },
  {
    id: "EQ-002",
    name: "Temperature Controller",
    department: "Quality Control",
    lastCalibration: "Feb 20, 2024",
    calibrationDue: "Aug 20, 2024",
    status: "Active",
  },
  {
    id: "EQ-003",
    name: "Flow Meter B",
    department: "Production",
    lastCalibration: "Dec 10, 2023",
    calibrationDue: "Jun 10, 2024",
    status: "Warning",
  },
  {
    id: "EQ-004",
    name: "pH Analyzer",
    department: "Laboratory",
    lastCalibration: "Mar 05, 2024",
    calibrationDue: "Sep 05, 2024",
    status: "Active",
  },
  {
    id: "EQ-005",
    name: "Conductivity Meter",
    department: "Laboratory",
    lastCalibration: "Nov 30, 2023",
    calibrationDue: "May 30, 2024",
    status: "Overdue",
  },
  {
    id: "EQ-006",
    name: "Vibration Analyzer",
    department: "Maintenance",
    lastCalibration: "Jan 25, 2024",
    calibrationDue: "Jul 25, 2024",
    status: "Active",
  },
  {
    id: "EQ-007",
    name: "Torque Wrench",
    department: "Maintenance",
    lastCalibration: "Oct 15, 2023",
    calibrationDue: "Apr 15, 2024",
    status: "Overdue",
  },
]

export default function CalibrationPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = tableData.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Equipment Calibration Dashboard</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Equipment
        </Button>
      </div>

      {/* Timeline Section */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Calibration Timeline</h2>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 right-0 h-1 bg-muted top-6 z-0"></div>

          {/* Timeline events */}
          <div className="flex justify-between relative z-10">
            {timelineData.map((event) => (
              <div key={event.id} className="flex flex-col items-center w-20">
                <div
                  className={`w-4 h-4 rounded-full z-10 mb-2 ${
                    event.status === "completed"
                      ? "bg-green-500"
                      : event.status === "current"
                        ? "bg-blue-500"
                        : "bg-muted-foreground"
                  }`}
                ></div>
                <p className="text-xs text-center font-medium">{event.date}</p>
                <p className="text-xs text-center text-muted-foreground mt-1 line-clamp-2">{event.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <h2 className="text-xl font-semibold">Equipment Calibration Status</h2>
          <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search equipment..."
                className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
                <span className="sr-only">Filter</span>
              </Button>
              <Button variant="outline" size="icon">
                <SortAsc className="h-4 w-4" />
                <span className="sr-only">Sort</span>
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Last Calibration</TableHead>
                <TableHead>Calibration Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {item.lastCalibration}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {item.calibrationDue}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : item.status === "Warning"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {item.status === "Active" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                      {item.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Update calibration</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit equipment</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete equipment</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

