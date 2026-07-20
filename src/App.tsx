import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import './App.css'
import Home from './Pages/Home'
import Admin from './Pages/Admin'
import AdminLogin from './Pages/AdminLogin'

const ADMIN_AUTH_KEY = "placement-admin-authenticated"

function ProtectedAdmin() {
  const isLoggedIn = sessionStorage.getItem(ADMIN_AUTH_KEY) === "true"

  return isLoggedIn ? <Admin/> : <Navigate to="/admin/login" replace />
}

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}></Route>
          <Route path='/admin/login' element={<AdminLogin authKey={ADMIN_AUTH_KEY}/>}></Route>
          <Route path='/admin' element={<ProtectedAdmin/>}></Route>
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={2500} theme="colored" />
    </>
  )
}

export default App
