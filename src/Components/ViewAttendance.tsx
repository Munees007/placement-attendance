
import { useEffect, useMemo, useState } from "react"
import { Button, Empty, Segmented, Select, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { fetchAttendance } from "../db/general"
import type { Attendance, student } from "../types/attendance.type"

type StatusFilter = student["status"] | "all"

export default function ViewAttendance() {
  const [attendanceRecords,setAttendanceRecords] = useState<Attendance[]>([])
  const [selectedDate,setSelectedDate] = useState<string>()
  const [statusFilter,setStatusFilter] = useState<StatusFilter>("all")
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
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-bold text-lg sm:text-xl uppercase tracking-wide sm:tracking-widest text-gray-400">View Attendance</p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
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
          <Button onClick={loadAttendance} loading={loading} className="w-full sm:w-auto">Refresh</Button>
        </div>
      </div>
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
          scroll={{x:640,y:"calc(100vh - 400px)"}}
        />
      ) : (
        <Empty description="No attendance records" />
      )}
    </div>
  )
}
