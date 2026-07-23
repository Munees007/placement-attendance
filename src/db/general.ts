import { get, ref, set } from "firebase/database"
import { toast } from "react-toastify"
import type { Attendance } from "../types/attendance.type"
import { db } from "./firebase"

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : "Something went wrong"
}

export const saveAttendance = async (attendanceData:Attendance) =>{
    try
    {
        const topic = attendanceData.topic.trim()
        if(!topic)
        {
            toast.error("Topic taught today is required")
            return false
        }

        const attendanceRef =  ref(db,`/attendance/${attendanceData.date}`)

        await set(attendanceRef,{
            ...attendanceData,
            topic
        })
        toast.success("Attendance saved successfully")
        return true
    }
    catch(e)
    {
        console.log(e)
        toast.error(`Attendance save failed: ${getErrorMessage(e)}`)
        return false
    }
}

export const fetchAttendance = async () =>{
    try
    {
        const attendanceRef = ref(db,"/attendance")
        const data = await get(attendanceRef)
        const records:Attendance[] = []

        if(data.exists())
        {
            data.forEach((value)=>{
                const attendance = value.val() as Attendance
                records.push({
                    date: attendance.date ?? value.key ?? "",
                    topic: attendance.topic ?? "",
                    student: Array.isArray(attendance.student) ? attendance.student : []
                })
            })
        }

        records.sort((a,b)=>{
            return new Date(b.date).getTime() - new Date(a.date).getTime()
        })

        toast.success("Attendance records loaded successfully")
        return records
    }
    catch(e)
    {
        console.log(e)
        toast.error(`Attendance load failed: ${getErrorMessage(e)}`)
        return []
    }
}
