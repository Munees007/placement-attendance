import { Grid, Menu } from "antd"
import type { MenuItemType } from "antd/es/menu/interface"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { BsDatabaseFillAdd } from "react-icons/bs"

import { MdDashboard } from "react-icons/md"
import ManageStudents from "../Components/ManageStudents"
import ViewAttendance from "../Components/ViewAttendance"

export default function Admin() {
    const [selectedMenu,setSelectedMenu] = useState('1');
    const navigate = useNavigate()
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.md
    const components: any = {
        '1': <ManageStudents/>, 
        '2':<ViewAttendance/>
    }
    const items:MenuItemType[] = [
        {
            key:'1',
            icon:<BsDatabaseFillAdd size={25}/>,
            label:'Manage Students'
        },
        {
            key:'2',
            icon:<MdDashboard size={25}/>,
            label:'View Attendance'
        }
    ]
  return (
    <div className="flex h-screen flex-col overflow-hidden">
        <div className="w-full min-h-12 shrink-0 bg-[#001529] flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-white p-3 uppercase ml-0 sm:ml-2 tracking-wide sm:tracking-widest font-bold text-sm sm:text-base">Attendance System</p>
            <button
                className="shrink-0 text-white text-sm mr-3 sm:mr-4 border border-white/40 rounded px-3 py-1"
                onClick={()=>{
                    sessionStorage.removeItem("placement-admin-authenticated")
                    navigate("/admin/login",{replace:true})
                }}
            >
                Logout
            </button>
        </div>
        <div className={`w-full flex flex-1 min-h-0 overflow-hidden ${isMobile ? "flex-col" : "flex-row"}`}>
            <Menu
            title="Attendance System"
                style={isMobile ? {width:"100%",overflowX:"auto"} : {width:236}}
                className={isMobile ? "shrink-0" : "h-full shrink-0"}
                onClick={(e)=>{
                    setSelectedMenu(e.key)
                }}
                selectedKeys={[selectedMenu]}
                mode={isMobile ? "horizontal" : "inline"}
                theme="dark"
                items={items}>
            </Menu>
            <div className="p-3 sm:p-4 rounded-lg flex-1 min-w-0 overflow-y-auto">
                {components[selectedMenu]}
            </div>
        </div>
    </div>
  )
}
