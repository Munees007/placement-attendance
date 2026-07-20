import { useEffect, useMemo, useState } from "react"
import type { Attendance, student } from "../types/attendance.type"
import { fetchStudents } from "../db/admin"
import { Button, Empty, Modal, Select, Table, Tag } from "antd"
import type { ColumnsType } from "antd/es/table"
import { saveAttendance } from "../db/general";

export default function Attendance() {
    const [attendanceData,setAttendanceData] = useState<Attendance>({
        date: new Date().toDateString(),
        student:[]
    });
    const [isReviewOpen,setIsReviewOpen] = useState(false)
    const [saving,setSaving] = useState(false)

    useEffect(()=>{
        const fetchData = async () =>{
            const temp = await fetchStudents();
            setAttendanceData(data => ({...data,student:temp}))
        }
        fetchData()
    },[])

    const absentStudents = useMemo(()=>{
        return attendanceData.student.filter(value => value.status === "absent")
    },[attendanceData.student])

    const permissionStudents = useMemo(()=>{
        return attendanceData.student.filter(value => value.status === "permission")
    },[attendanceData.student])

    const reviewStudents = useMemo(()=>{
        return [...absentStudents,...permissionStudents]
    },[absentStudents,permissionStudents])

    const reviewColumns:ColumnsType<student> = [
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
                <Tag color={status === "absent" ? "red" : "gold"}>
                    {status.toUpperCase()}
                </Tag>
            )
        }
    ]

    const handleAttendance = async () =>{
        setSaving(true)
        const saved = await saveAttendance(attendanceData);
        setSaving(false)
        if(saved)
        {
            setIsReviewOpen(false)
        }
    }
  return (
    <div className="flex h-dvh w-full flex-col items-center gap-3 overflow-hidden p-3 sm:p-4">
        <p className="shrink-0 text-lg sm:text-2xl font-bold text-center uppercase tracking-wide sm:tracking-widest">Attendance Page - {attendanceData.date}</p>
        <div className="flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-xl shadow-lg border border-slate-200">
            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-3 sm:hidden">
                {attendanceData.student.length ? attendanceData.student.map((value, index) => (
                    <div key={value.rollNo} className="mb-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase text-slate-500">#{index + 1} - {value.rollNo}</p>
                                <p className="wrap-break-word text-base font-semibold text-slate-800">{value.name}</p>
                            </div>
                        </div>
                        <Select
                            className="w-full"
                            value={value.status}
                            onChange={(e)=>{
                                setAttendanceData(d =>{
                                    return {
                                        ...d,
                                        student:d.student.map((studentValue,studentIndex)=>{
                                            return studentIndex === index ? {
                                                ...studentValue,
                                                status:e.toString() as 'present' | 'absent' | 'permission'
                                            } : studentValue
                                        })
                                    }
                                })
                            }}
                            options={[
                                { value: "present", label: "Present" },
                                { value: "absent", label: "Absent" },
                                { value: "permission", label: "Permission" },
                            ]}
                        />
                    </div>
                )) : (
                    <div className="flex h-full items-center justify-center">
                        <Empty description="No students found" />
                    </div>
                )}
            </div>
            <div className="hidden min-h-0 flex-1 overflow-auto sm:block">
            <table className="min-w-180 w-full border-collapse bg-white">
                <thead className="sticky top-0 z-10 bg-slate-800 text-white">
                <tr>
                    <th className="px-4 py-3 text-center w-16">S.No</th>
                    <th className="px-4 py-3 text-left">Roll No</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-center w-40">Attendance</th>
                </tr>
                </thead>

                <tbody>
                {attendanceData.student.map((value, index) => (
                    <tr
                    key={value.rollNo}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                    <td className="px-4 py-3 text-center font-medium">
                        {index + 1}
                    </td>

                    <td className="px-4 py-3">
                        {value.rollNo}
                    </td>

                    <td className="px-4 py-3 font-medium">
                        {value.name}
                    </td>

                    <td className="px-4 py-3">
                        <Select
                        className="w-full"
                        value={value.status}
                        onChange={(e)=>{
                            setAttendanceData(d =>{
                                return {
                                    ...d,
                                    student:d.student.map((studentValue,studentIndex)=>{
                                        return studentIndex === index ? {
                                            ...studentValue,
                                            status:e.toString() as 'present' | 'absent' | 'permission'
                                        } : studentValue
                                    })
                                }
                            })
                        }}
                        options={[
                            { value: "present", label: "Present" },
                            { value: "absent", label: "Absent" },
                            { value: "permission", label: "Permission" },
                        ]}
                        />
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <Button type="primary" onClick={()=>setIsReviewOpen(true)} className="w-full shrink-0">Save Attendance</Button>
            </div>
            <Modal
                title="Review Attendance"
                open={isReviewOpen}
                okText="Save Attendance"
                onOk={handleAttendance}
                confirmLoading={saving}
                onCancel={()=>setIsReviewOpen(false)}
                okButtonProps={{disabled: attendanceData.student.length === 0}}
                width="min(720px, calc(100vw - 32px))"
            >
                <div className="flex flex-col gap-3 mb-4 sm:flex-row">
                    <div className="border border-slate-200 rounded-md px-4 py-3 flex-1">
                        <p className="text-sm text-slate-500">Absents</p>
                        <p className="text-2xl font-bold text-red-500">{absentStudents.length}</p>
                    </div>
                    <div className="border border-slate-200 rounded-md px-4 py-3 flex-1">
                        <p className="text-sm text-slate-500">Permissions</p>
                        <p className="text-2xl font-bold text-amber-500">{permissionStudents.length}</p>
                    </div>
                </div>
                {reviewStudents.length ? (
                    <Table
                        rowKey="rollNo"
                        columns={reviewColumns}
                        dataSource={reviewStudents}
                        pagination={false}
                        size="small"
                        scroll={{x:520,y:260}}
                    />
                ) : (
                    <Empty description="No absents or permissions" />
                )}
            </Modal>
    </div>
  )
}
