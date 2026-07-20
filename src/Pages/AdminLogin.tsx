import { Button, Form, Input } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

type AdminLoginProps = {
    authKey:string
}

type LoginForm = {
    username:string
    password:string
}

export default function AdminLogin({authKey}:AdminLoginProps) {
    const navigate = useNavigate()
    const [loading,setLoading] = useState(false)

    const handleLogin = (values:LoginForm) =>{
        setLoading(true)

        const adminUsername = import.meta.env.VITE_APP_ADMIN_USERNAME
        const adminPassword = import.meta.env.VITE_APP_ADMIN_PASSWORD

        if(!adminUsername || !adminPassword)
        {
            toast.error("Admin credentials are not configured")
            setLoading(false)
            return
        }

        if(values.username === adminUsername && values.password === adminPassword)
        {
            sessionStorage.setItem(authKey,"true")
            toast.success("Admin login successful")
            navigate("/admin",{replace:true})
        }
        else
        {
            toast.error("Invalid admin username or password")
        }

        setLoading(false)
    }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6">
            <div className="mb-6">
                <p className="text-xl sm:text-2xl font-bold uppercase tracking-wide sm:tracking-widest text-slate-800">Admin Login</p>
                <p className="text-sm text-slate-500 mt-1">Attendance System</p>
            </div>
            <Form layout="vertical" onFinish={handleLogin}>
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[{required:true,message:"Enter admin username"}]}
                >
                    <Input placeholder="Enter username" autoComplete="username" />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{required:true,message:"Enter admin password"}]}
                >
                    <Input.Password placeholder="Enter password" autoComplete="current-password" />
                </Form.Item>
                <Button loading={loading} type="primary" htmlType="submit" className="w-full">
                    Login
                </Button>
            </Form>
        </div>
    </div>
  )
}
