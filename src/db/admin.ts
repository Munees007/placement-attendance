import { get, ref, remove, set, update } from "firebase/database";
import { toast } from "react-toastify";
import type { student, studentForm } from "../types/attendance.type";
import { db } from "./firebase";

const getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : "Something went wrong"
}

export const addStudent = async (student:studentForm) =>{
    try{
        const roll = student.roll.trim().toUpperCase()
        const name = student.name.trim().toUpperCase()
        if(!roll || !name)
        {
            toast.error("Roll no and name are required")
            return false
        }

        const studentRef = ref(db,`/students/${roll}`);
        await set(studentRef,name)
        toast.success("Student saved successfully")
        return true
    }
    catch(e)
    {
        console.error(e)
        toast.error(`Student save failed: ${getErrorMessage(e)}`)
        return false
    }
}

export const uploadStudents = async (students:studentForm[]) =>{
    try{
        const studentsData = students.reduce<Record<string,string>>((acc,value)=>{
            const roll = value.roll.trim().toUpperCase()
            const name = value.name.trim().toUpperCase()
            if(roll && name)
            {
                acc[roll] = name
            }
            return acc
        },{})

        const count = Object.keys(studentsData).length
        if(!count)
        {
            toast.error("No valid students to upload")
            return 0
        }

        const studentRef = ref(db,"/students");
        await update(studentRef,studentsData)
        toast.success(`${count} students uploaded successfully`)
        return count
    }
    catch(e)
    {
        console.error(e)
        toast.error(`Students upload failed: ${getErrorMessage(e)}`)
        return 0
    }
}

export const updateStudent = async (oldRollNo:string, student:studentForm) =>{
    try{
        const oldRoll = oldRollNo.trim().toUpperCase()
        const roll = student.roll.trim().toUpperCase()
        const name = student.name.trim().toUpperCase()

        if(!oldRoll || !roll || !name)
        {
            toast.error("Roll no and name are required")
            return false
        }

        if(oldRoll === roll)
        {
            const studentRef = ref(db,`/students/${roll}`);
            await set(studentRef,name)
        }
        else
        {
            await update(ref(db),{
                [`/students/${oldRoll}`]: null,
                [`/students/${roll}`]: name
            })
        }

        toast.success("Student updated successfully")
        return true
    }
    catch(e)
    {
        console.error(e)
        toast.error(`Student update failed: ${getErrorMessage(e)}`)
        return false
    }
}

export const deleteStudent = async (rollNo:string) =>{
    try{
        const roll = rollNo.trim().toUpperCase()
        if(!roll)
        {
            toast.error("Roll no is required")
            return false
        }

        const studentRef = ref(db,`/students/${roll}`);
        await remove(studentRef)
        toast.success("Student deleted successfully")
        return true
    }
    catch(e)
    {
        console.error(e)
        toast.error(`Student delete failed: ${getErrorMessage(e)}`)
        return false
    }
}

export const fetchStudents = async () =>{
    try{
        const studentRef = ref(db,'/students')

        const data = await get(studentRef)
        const d:student[] = []
        if(data.exists())
        {
            data.forEach((value)=>{
                d.push({
                    name:value.val(),
                    rollNo:value.key ?? "",
                    status:'present'
                })
            })
        }
        toast.success("Students loaded successfully")
        return d
    }
    catch(e)
    {
        console.log(e)
        toast.error(`Students load failed: ${getErrorMessage(e)}`)
        return []
    }
}
