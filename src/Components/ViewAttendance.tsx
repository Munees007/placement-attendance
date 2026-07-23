import { useEffect, useMemo, useState } from "react"
import { Button, Empty, Input, Segmented, Select, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { fetchAttendance } from "../db/general"
import type { Attendance, student } from "../types/attendance.type"

type StatusFilter = student["status"] | "all"
type AttendanceView = "daily" | "overall"
type ReportFilter = "currentMonth" | "month" | "custom"

type StudentReportRow = {
  key:string
  sNo:number
  rollNo:string
  name:string
  present:number
  absent:number
  permission:number
  marked:number
}

type DayReportRow = {
  key:string
  date:string
  topic:string
  present:number
  absent:number
  permission:number
  total:number
}

const parseAttendanceDate = (value:string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const formatMonthValue = (date = new Date()) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}`
}

const formatDateValue = (date = new Date()) => {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2,"0"),
    String(date.getDate()).padStart(2,"0")
  ].join("-")
}

const getCurrentMonthStartValue = () => {
  const today = new Date()
  return formatDateValue(new Date(today.getFullYear(),today.getMonth(),1))
}

const parseMonthValue = (value:string) => {
  const [year,month] = value.split("-").map(Number)

  if(!year || !month)
  {
    return undefined
  }

  return {
    year,
    month:month - 1
  }
}

const parseInputDateValue = (value:string) => {
  const [year,month,day] = value.split("-").map(Number)

  if(!year || !month || !day)
  {
    return undefined
  }

  return new Date(year,month - 1,day)
}

const startOfDay = (date:Date) => {
  return new Date(date.getFullYear(),date.getMonth(),date.getDate())
}

export default function ViewAttendance() {
  const [attendanceRecords,setAttendanceRecords] = useState<Attendance[]>([])
  const [selectedDate,setSelectedDate] = useState<string>()
  const [statusFilter,setStatusFilter] = useState<StatusFilter>("all")
  const [activeView,setActiveView] = useState<AttendanceView>("daily")
  const [reportFilter,setReportFilter] = useState<ReportFilter>("currentMonth")
  const [reportMonth,setReportMonth] = useState(()=>formatMonthValue())
  const [customStartDate,setCustomStartDate] = useState(getCurrentMonthStartValue)
  const [customEndDate,setCustomEndDate] = useState(()=>formatDateValue())
  const [loading,setLoading] = useState(false)

  const loadAttendance = async () =>{
    setLoading(true)
    const records = await fetchAttendance()
    setAttendanceRecords(records)
    setSelectedDate(value => value ?? records[0]?.date)
    setLoading(false)
  }

  useEffect(()=>{
    loadAttendance()
  },[])

  const selectedAttendance = useMemo(()=>{
    return attendanceRecords.find(value => value.date === selectedDate)
  },[attendanceRecords,selectedDate])

  const counts = useMemo(()=>{
    const students = selectedAttendance?.student ?? []
    return {
      present:students.filter(value => value.status === "present").length,
      absent:students.filter(value => value.status === "absent").length,
      permission:students.filter(value => value.status === "permission").length,
      total:students.length
    }
  },[selectedAttendance])

  const filteredReportRecords = useMemo(()=>{
    const today = new Date()
    const selectedMonth = parseMonthValue(reportMonth)
    const customStart = parseInputDateValue(customStartDate)
    const customEnd = parseInputDateValue(customEndDate)
    const fromDate = customStart && customEnd && customStart > customEnd ? customEnd : customStart
    const toDate = customStart && customEnd && customStart > customEnd ? customStart : customEnd

    return attendanceRecords.filter((record)=>{
      const recordDate = parseAttendanceDate(record.date)

      if(!recordDate)
      {
        return false
      }

      if(reportFilter === "currentMonth")
      {
        return recordDate.getFullYear() === today.getFullYear() && recordDate.getMonth() === today.getMonth()
      }

      if(reportFilter === "month")
      {
        return !!selectedMonth && recordDate.getFullYear() === selectedMonth.year && recordDate.getMonth() === selectedMonth.month
      }

      const normalizedDate = startOfDay(recordDate).getTime()

      if(fromDate && normalizedDate < startOfDay(fromDate).getTime())
      {
        return false
      }

      if(toDate && normalizedDate > startOfDay(toDate).getTime())
      {
        return false
      }

      return true
    })
  },[attendanceRecords,customEndDate,customStartDate,reportFilter,reportMonth])

  const studentReportRows = useMemo(()=>{
    const studentMap = new Map<string,StudentReportRow>()

    filteredReportRecords.forEach((record)=>{
      record.student.forEach((studentValue)=>{
        const key = studentValue.rollNo || studentValue.name
        const existing = studentMap.get(key) ?? {
          key,
          sNo:0,
          rollNo:studentValue.rollNo,
          name:studentValue.name,
          present:0,
          absent:0,
          permission:0,
          marked:0
        }

        if(studentValue.status === "present")
        {
          existing.present += 1
        }
        else if(studentValue.status === "absent")
        {
          existing.absent += 1
        }
        else
        {
          existing.permission += 1
        }

        existing.marked += 1
        studentMap.set(key,existing)
      })
    })

    return Array.from(studentMap.values())
      .sort((a,b)=>a.rollNo.localeCompare(b.rollNo,undefined,{numeric:true}))
      .map((value,index)=>({
        ...value,
        sNo:index + 1
      }))
  },[filteredReportRecords])

  const dayReportRows = useMemo(()=>{
    return filteredReportRecords.map((record)=>{
      const students = record.student ?? []

      return {
        key:record.date,
        date:record.date,
        topic:record.topic || "Not recorded",
        present:students.filter(value => value.status === "present").length,
        absent:students.filter(value => value.status === "absent").length,
        permission:students.filter(value => value.status === "permission").length,
        total:students.length
      }
    })
  },[filteredReportRecords])

  const reportCounts = useMemo(()=>{
    return studentReportRows.reduce((acc,value)=>{
      return {
        students:studentReportRows.length,
        days:filteredReportRecords.length,
        present:acc.present + value.present,
        absent:acc.absent + value.absent,
        permission:acc.permission + value.permission
      }
    },{
      students:studentReportRows.length,
      days:filteredReportRecords.length,
      present:0,
      absent:0,
      permission:0
    })
  },[filteredReportRecords.length,studentReportRows])

  const columns:ColumnsType<student & {sNo:number}> = [
    {
      title:"S.No",
      dataIndex:"sNo",
      key:"sNo",
      width:80
    },
    {
      title:"Roll No",
      dataIndex:"rollNo",
      key:"rollNo"
    },
    {
      title:"Name",
      dataIndex:"name",
      key:"name"
    },
    {
      title:"Status",
      dataIndex:"status",
      key:"status",
      render:(status:student["status"])=>( 
        <Tag color={status === "present" ? "green" : status === "absent" ? "red" : "gold"}>
          {status.toUpperCase()}
        </Tag>
      )
    }
  ]

  const studentReportColumns:ColumnsType<StudentReportRow> = [
    {
      title:"S.No",
      dataIndex:"sNo",
      key:"sNo",
      width:80
    },
    {
      title:"Roll No",
      dataIndex:"rollNo",
      key:"rollNo"
    },
    {
      title:"Name",
      dataIndex:"name",
      key:"name"
    },
    {
      title:"Present Days",
      dataIndex:"present",
      key:"present",
      render:(value:number)=><span className="font-semibold text-green-600">{value}</span>
    },
    {
      title:"Absent Days",
      dataIndex:"absent",
      key:"absent",
      render:(value:number)=><span className="font-semibold text-red-500">{value}</span>
    },
    {
      title:"Permission Days",
      dataIndex:"permission",
      key:"permission",
      render:(value:number)=><span className="font-semibold text-amber-500">{value}</span>
    },
    {
      title:"Marked Days",
      dataIndex:"marked",
      key:"marked"
    }
  ]

  const dayReportColumns:ColumnsType<DayReportRow> = [
    {
      title:"Date",
      dataIndex:"date",
      key:"date",
      width:160
    },
    {
      title:"Topic",
      dataIndex:"topic",
      key:"topic",
      render:(topic:string)=><span className="whitespace-pre-wrap">{topic}</span>
    },
    {
      title:"Present",
      dataIndex:"present",
      key:"present",
      width:100
    },
    {
      title:"Absent",
      dataIndex:"absent",
      key:"absent",
      width:100
    },
    {
      title:"Permission",
      dataIndex:"permission",
      key:"permission",
      width:120
    },
    {
      title:"Total",
      dataIndex:"total",
      key:"total",
      width:90
    }
  ]

  const tableData = useMemo(()=>{
    return (selectedAttendance?.student ?? [])
      .filter(value => statusFilter === "all" || value.status === statusFilter)
      .map((value,index)=>({
        ...value,
        sNo:index + 1
      }))
  },[selectedAttendance,statusFilter])

  return (
    <div className="w-full h-full min-h-0 flex flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-lg sm:text-xl uppercase text-gray-400">View Attendance</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <div className="w-full overflow-x-auto sm:w-auto">
              <Segmented
                className="min-w-max"
                value={activeView}
                onChange={(value)=>setActiveView(value as AttendanceView)}
                options={[
                  {label:"Daily",value:"daily"},
                  {label:"Overall Report",value:"overall"}
                ]}
              />
            </div>
            <Button onClick={loadAttendance} loading={loading} className="w-full sm:w-auto">Refresh</Button>
          </div>
        </div>
        {activeView === "daily" ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <div className="w-full overflow-x-auto sm:w-auto">
              <Segmented
                className="min-w-max"
                value={statusFilter}
                onChange={(value)=>setStatusFilter(value as StatusFilter)}
                options={[
                  {label:"All",value:"all"},
                  {label:"Present",value:"present"},
                  {label:"Absent",value:"absent"},
                  {label:"Permission",value:"permission"}
                ]}
              />
            </div>
            <Select
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Select date"
              className="w-full sm:w-60"
              options={attendanceRecords.map(value => ({label:value.date,value:value.date}))}
            />
          </div>
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="w-full overflow-x-auto sm:w-auto">
              <Segmented
                className="min-w-max"
                value={reportFilter}
                onChange={(value)=>setReportFilter(value as ReportFilter)}
                options={[
                  {label:"This Month",value:"currentMonth"},
                  {label:"Choose Month",value:"month"},
                  {label:"Custom Dates",value:"custom"}
                ]}
              />
            </div>
            {reportFilter === "month" ? (
              <Input
                type="month"
                value={reportMonth}
                onChange={(e)=>setReportMonth(e.target.value)}
                className="w-full sm:w-44"
              />
            ) : null}
            {reportFilter === "custom" ? (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e)=>setCustomStartDate(e.target.value)}
                  className="w-full sm:w-40"
                />
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e)=>setCustomEndDate(e.target.value)}
                  className="w-full sm:w-40"
                />
              </>
            ) : null}
          </div>
        )}
      </div>

      {activeView === "daily" ? (
        <>
          {selectedAttendance ? (
            <div className="shrink-0 border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Topic Taught</p>
              <p className="whitespace-pre-wrap text-sm font-semibold text-slate-800">{selectedAttendance.topic || "Not recorded"}</p>
            </div>
          ) : null}
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{counts.total}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Present</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{counts.present}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Absent</p>
              <p className="text-xl sm:text-2xl font-bold text-red-500">{counts.absent}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Permission</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-500">{counts.permission}</p>
            </div>
          </div>
          {selectedAttendance ? (
            <Table
              rowKey="rollNo"
              columns={columns}
              dataSource={tableData}
              loading={loading}
              pagination={false}
              scroll={{x:640,y:"calc(100vh - 460px)"}}
            />
          ) : (
            <Empty description="No attendance records" />
          )}
        </>
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Days</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{reportCounts.days}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Students</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-800">{reportCounts.students}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Present</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{reportCounts.present}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Absent</p>
              <p className="text-xl sm:text-2xl font-bold text-red-500">{reportCounts.absent}</p>
            </div>
            <div className="border border-slate-200 rounded-md px-3 py-2 sm:px-4 sm:py-3">
              <p className="text-sm text-slate-500">Permission</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-500">{reportCounts.permission}</p>
            </div>
          </div>
          {studentReportRows.length ? (
            <>
              <Table
                rowKey="key"
                columns={studentReportColumns}
                dataSource={studentReportRows}
                loading={loading}
                pagination={false}
                scroll={{x:860}}
              />
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-slate-600">Day Report</p>
                <Table
                  rowKey="key"
                  columns={dayReportColumns}
                  dataSource={dayReportRows}
                  loading={loading}
                  pagination={{pageSize:8,showSizeChanger:false}}
                  scroll={{x:760}}
                  size="small"
                />
              </div>
            </>
          ) : (
            <Empty description="No attendance records for this filter" />
          )}
        </>
      )}
    </div>
  )
}
