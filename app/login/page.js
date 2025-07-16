'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BiSolidHide, BiShow } from "react-icons/bi";
export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    const email = e.target.email.value.trim()
    const password = e.target.password.value

    try {
      const res = await fetch('/api/thingsboard/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Store token in localStorage/sessionStorage/cookie as needed
      localStorage.setItem('tb_token', data.token)
      localStorage.setItem('tb_userId', data.userId)
      localStorage.setItem('tb_customerId', data.customerId)
      localStorage.setItem('userName', data.userName)
      localStorage.setItem('userAuthority', data.userAuthority)


      if (data.userAuthority === 'TENANT_ADMIN') {
        router.push('/admindashboard')
      } 
      else if (data.userAuthority === 'CUSTOMER_USER') {
        const res = await fetch('/api/thingsboard/devices', {
          method: 'POST',
          body: JSON.stringify({ customerId: data.customerId, token: data.token }),
        })
        const devdata = await res.json()
        if (!res.ok) throw new Error(devdata.error)
        localStorage.setItem('tb_devices', JSON.stringify(devdata.devices))
        router.push('/dashboard')
      }
    } catch (err) {
      alert(err.message || 'Login failed')
    }   
  }
  const handleForgotPass = async (e) => {
    e.preventDefault()
    const email = e.target.email.value.trim()

    try {
      const res = await fetch('/api/thingsboard/forgotpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        alert(`Reset link sent to ${email}`)
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Password reset failed')
      }
    } catch (err) {
      alert(err.message || 'Something went wrong')
    }
    finally {
      setNewPassword(false)
    }
  }


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-50">
      <img src="/company_logo[1].png" alt="logo" className='h-24' />
      <h1 className="text-3xl font-bold text-blue-700 mt-4 text-center">Water Monitoring Dashboard Login</h1>
      {!newPassword ?
        <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-10">
          <input name="email" type="email" placeholder="Email" required className="border p-2 rounded" />
          <div className="relative">
            <input name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              className="border p-2 rounded w-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-sm text-blue-500"
            >
              {showPassword ? <BiSolidHide size={28} /> : <BiShow size={28} />}
            </button>
          </div>
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className='text-md text-right'>
            <button type="button" onClick={() => setNewPassword(true)} className='hover:underline cursor-pointer'>Forgot Password ?</button>
          </div>
        </form>
        :
        <form onSubmit={handleForgotPass} className="flex flex-col gap-4 mt-10">
          <input name="email" type="email" placeholder="Enter your email" required className="border p-2 rounded" />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Send Reset Link
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </form>

      }
    </div>
  )
}
