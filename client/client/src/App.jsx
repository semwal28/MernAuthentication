import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/login.jsx'
import Home from './pages/home.jsx'
import EmailVerify from './pages/EmailVerify.jsx'
import ResetPassword from './pages/resetPassword.jsx'
import { ToastContainer} from 'react-toastify';
const App = () => {
  return (
    <div  >
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/email-verify' element={<EmailVerify/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>
      </Routes>
    </div>
  )
}

export default App