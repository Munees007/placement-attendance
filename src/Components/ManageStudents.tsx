import { Button, Input, Modal, Popconfirm, Space, Table, Upload } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import type { student, studentForm } from "../types/attendance.type";
import { addStudent, deleteStudent, fetchStudents, updateStudent, uploadStudents } from "../db/admin";

type UploadStudentRow = studentForm & {
    key:string
}

type StudentTableRow = student & {
    key:string
    sNo:number
}

const parseDelimitedLine = (line:string,delimiter:string) =>{
    const values:string[] = []
    let current = ""
    let insideQuotes = false

    for(let i = 0;i < line.length;i++)
    {
        const char = line[i]
        const nextChar = line[i + 1]

        if(char === '"' && nextChar === '"')
        {
            current += '"'
            i++
        }
        else if(char === '"')
        {
            insideQuotes = !insideQuotes
        }
        else if(char === delimiter && !insideQuotes)
        {
            values.push(current.trim())
            current = ""
        }
        else
        {
            current += char
        }
    }

    values.push(current.trim())
    return values
}

const normalizeHeader = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g,"")

const parseStudentsFromText = (text:string,fileName:string) =>{
    if(fileName.toLowerCase().endsWith(".json"))
    {
        const data = JSON.parse(text) as Array<Record<string,string>>
        return data.map(value => ({
            roll:(value.roll ?? value.rollNo ?? value.rollno ?? "").toString().toUpperCase(),
            name:(value.name ?? "").toString().toUpperCase()
        })).filter(value => value.roll && value.name)
    }

    const lines = text.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
    if(!lines.length)
    {
        return []
    }

    const delimiter = lines[0].includes("\t") ? "\t" : ","
    const firstRow = parseDelimitedLine(lines[0],delimiter)
    const normalizedHeaders = firstRow.map(normalizeHeader)
    const rollIndex = normalizedHeaders.findIndex(value => ["roll","rollno","regno","registrationno"].includes(value))
    const nameIndex = normalizedHeaders.findIndex(value => ["name","studentname"].includes(value))
    const hasHeader = rollIndex > -1 && nameIndex > -1

    return lines.slice(hasHeader ? 1 : 0).map((line)=>{
        const columns = parseDelimitedLine(line,delimiter)
        return {
            roll:(columns[hasHeader ? rollIndex : 0] ?? "").toUpperCase(),
            name:(columns[hasHeader ? nameIndex : 1] ?? "").toUpperCase()
        }
    }).filter(value => value.roll && value.name)
}

export default function ManageStudents() {
    const [formData,setFormData] = useState<studentForm>({
        name:"",
        roll:""
    })
    const [uploadRows,setUploadRows] = useState<UploadStudentRow[]>([])
    const [students,setStudents] = useState<student[]>([])
    const [adding,setAdding] = useState(false)
    const [uploading,setUploading] = useState(false)
    const [loadingStudents,setLoadingStudents] = useState(false)
    const [editingStudent,setEditingStudent] = useState<student | null>(null)
    const [editFormData,setEditFormData] = useState<studentForm>({
        name:"",
        roll:""
    })
    const [updating,setUpdating] = useState(false)
    const [deletingRoll,setDeletingRoll] = useState<string>()

    const uploadColumns:ColumnsType<UploadStudentRow> = [
        {
            title:"Roll No",
            dataIndex:"roll",
            key:"roll"
        },
        {
            title:"Name",
            dataIndex:"name",
            key:"name"
        }
    ]

    const studentColumns:ColumnsType<StudentTableRow> = [
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
            title:"Action",
            key:"action",
            width:180,
            render:(_,record)=>(
                <Space>
                    <Button size="small" onClick={()=>openEditModal(record)}>Edit</Button>
                    <Popconfirm
                        title="Delete student"
                        description={`Delete ${record.rollNo}?`}
                        okText="Delete"
                        okButtonProps={{danger:true,loading:deletingRoll === record.rollNo}}
                        onConfirm={()=>handleDeleteStudent(record.rollNo)}
                    >
                        <Button danger size="small">Delete</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    const loadStudents = async () =>{
        setLoadingStudents(true)
        const data = await fetchStudents()
        setStudents(data)
        setLoadingStudents(false)
    }

    useEffect(()=>{
        loadStudents()
    },[])

    const handleFileUpload = (file:File) =>{
        const reader = new FileReader()

        reader.onload = () =>{
            try
            {
                const students = parseStudentsFromText(String(reader.result ?? ""),file.name)
                const uniqueStudents = Array.from(new Map(students.map(value => [value.roll,value])).values())
                setUploadRows(uniqueStudents.map((value,index)=>({...value,key:`${value.roll}-${index}`})))

                if(uniqueStudents.length)
                {
                    toast.success(`${uniqueStudents.length} students ready to upload`)
                }
                else
                {
                    toast.error("No valid students found in file")
                }
            }
            catch(e)
            {
                console.error(e)
                toast.error("Unable to read students file")
                setUploadRows([])
            }
        }

        reader.onerror = () =>{
            toast.error("Unable to read students file")
            setUploadRows([])
        }

        reader.readAsText(file)
        return false
    }

    const handleAddStudent = async () =>{
        setAdding(true)
        const saved = await addStudent(formData)
        setAdding(false)
        if(saved)
        {
            setFormData({name:"",roll:""})
            await loadStudents()
        }
    }

    const handleUploadStudents = async () =>{
        setUploading(true)
        const count = await uploadStudents(uploadRows)
        setUploading(false)
        if(count)
        {
            setUploadRows([])
            await loadStudents()
        }
    }

    const openEditModal = (studentValue:student) =>{
        setEditingStudent(studentValue)
        setEditFormData({
            roll:studentValue.rollNo,
            name:studentValue.name
        })
    }

    const handleUpdateStudent = async () =>{
        if(!editingStudent)
        {
            return
        }

        setUpdating(true)
        const updated = await updateStudent(editingStudent.rollNo,editFormData)
        setUpdating(false)
        if(updated)
        {
            setEditingStudent(null)
            setEditFormData({name:"",roll:""})
            await loadStudents()
        }
    }

    const handleDeleteStudent = async (rollNo:string) =>{
        setDeletingRoll(rollNo)
        const deleted = await deleteStudent(rollNo)
        setDeletingRoll(undefined)
        if(deleted)
        {
            await loadStudents()
        }
    }

    const studentTableData = students.map((value,index)=>({
        ...value,
        key:value.rollNo,
        sNo:index + 1
    }))

  return (
    <div className="w-full min-w-0">
        <div className="flex gap-2 flex-col w-full">
            <p className="font-bold text-lg sm:text-xl uppercase tracking-wide sm:tracking-widest text-gray-400">Add Students</p>
            <div className="flex flex-col gap-2 w-full px-0 sm:flex-row sm:px-10">
                <Input value={formData.roll} onChange={(e)=>{
                    setFormData(d => {
                        return {...d,roll:e.target.value.toUpperCase()}
                    })
                }} placeholder="Enter roll no" className="w-full uppercase sm:max-w-xs"></Input>
                <Input value={formData.name} onChange={(e)=>{
                    setFormData(d => {
                        return {...d,name:e.target.value.toUpperCase()}
                    })
                }} placeholder="Enter Name" className="uppercase"></Input>
                <Button onClick={handleAddStudent} loading={adding} type="primary" className="w-full sm:w-auto">Add</Button>
            </div>
        </div>
        <hr className="my-3 text-black/10"/>
        <div className="flex gap-2 flex-col w-full">
            <p className="font-bold text-lg sm:text-xl uppercase tracking-wide sm:tracking-widest text-gray-400">Upload Students</p>
            <div className="flex flex-col gap-2 px-0 sm:flex-row sm:px-10 sm:items-center">
                <Upload
                    accept=".csv,.tsv,.txt,.json"
                    beforeUpload={handleFileUpload}
                    maxCount={1}
                    showUploadList={false}
                    className="w-full sm:w-auto"
                >
                    <Button className="w-full sm:w-auto">Choose File</Button>
                </Upload>
                <Button
                    disabled={!uploadRows.length}
                    loading={uploading}
                    onClick={handleUploadStudents}
                    type="primary"
                    className="w-full sm:w-auto"
                >
                    Upload Students
                </Button>
                <p className="text-sm text-slate-500">{uploadRows.length} ready</p>
            </div>
            {uploadRows.length ? (
                <div className="px-0 pt-3 sm:px-10">
                    <Table
                        columns={uploadColumns}
                        dataSource={uploadRows}
                        pagination={false}
                        size="small"
                        scroll={{x:600}}
                    />
                </div>
            ) : null}
        </div>
        <hr className="my-3 text-black/10"/>
        <div className="flex flex-col gap-3">
            <p className="font-bold text-lg sm:text-xl uppercase tracking-wide sm:tracking-widest text-gray-400">Manage Students</p>
            <div className="px-0 sm:px-10">
                <Table
                    columns={studentColumns}
                    dataSource={studentTableData}
                    loading={loadingStudents}
                    pagination={false}
                    size="small"
                    scroll={{x:700}}
                />
            </div>
        </div>
        <Modal
            title="Update Student"
            open={!!editingStudent}
            okText="Update"
            onOk={handleUpdateStudent}
            confirmLoading={updating}
            onCancel={()=>setEditingStudent(null)}
        >
            <div className="flex flex-col gap-3 pt-2">
                <Input
                    value={editFormData.roll}
                    onChange={(e)=>{
                        setEditFormData(d => ({...d,roll:e.target.value.toUpperCase()}))
                    }}
                    placeholder="Enter roll no"
                    className="uppercase"
                />
                <Input
                    value={editFormData.name}
                    onChange={(e)=>{
                        setEditFormData(d => ({...d,name:e.target.value.toUpperCase()}))
                    }}
                    placeholder="Enter Name"
                    className="uppercase"
                />
            </div>
        </Modal>
    </div>
  )
}
