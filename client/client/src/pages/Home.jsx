import React from 'react'
import Navbar from '../components/Navbar'
import Header from '../components/Header'

const Home = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-[url("/bg_img.png")] bg-cover bg-center'>
        <h1>
            <Navbar/>
            <Header/>
        </h1>
    </div>
  )
}

export default Home