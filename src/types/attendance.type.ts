export interface studentForm
{
    roll:string,
    name:string
}
export interface student
{
    name:string
    rollNo: string //in firebase realtime database,
    status: 'present' | 'absent' | 'permission'
}
export interface Attendance
{
    date: string,
    student:student[]
}