import React from 'react'

const WaterProperty = () => {
    return (
        <div className='flex justify-between bg-white'>
            <div className='p-2 bg-white rounded-md shadow-md '>
                <p className='text-lg font-medium'>Operator Info</p>
                <div className="flex py-1 gap-2 items-center justify-between">
                    <p className="text-sm font-medium">Name</p>
                    <span>Ramesh Lal</span>
                </div>
                <div className="flex py-1 items-center gap-4">
                    <p className="text-sm font-medium">Current Shift</p>
                    <span>A</span>
                </div>
            </div>
            <div className='p-2 bg-white rounded-md shadow-md '>
                <p className='text-lg font-medium'>Inlet Properties</p>
                <div className="flex py-1 gap-2 items-center justify-between">
                    <p className="text-sm font-medium">Flow Rate</p>
                    <span>1200 L/hr</span>
                </div>
                <div className="flex py-1 items-center gap-4">
                    <p className="text-sm font-medium">TDS</p>
                    <span>750 ppm</span>
                </div>
            </div>
            <div className='p-2 bg-white rounded-md shadow-md '>
                <p className='text-lg font-medium'>Reject Properties</p>
                <div className="flex py-1 items-center justify-between">
                    <p className="text-sm font-medium">Flow Rate</p>
                    <span>50 L/hr</span>
                </div>
                <div className="flex py-1 items-center gap-4">
                    <p className="text-sm font-medium">TDS</p>
                    <span>600 ppm</span>
                </div>
            </div>
            <div className='p-2 bg-white rounded-md shadow-md '>
                <p className='text-lg font-medium'>Outlet Properties</p>
                    <div className="flex py-1 gap-2 items-center justify-between">
                        <p className="text-sm font-medium">Flow Rate</p>
                        <span>1150 L/hr</span>
                    </div>
                    <div className="flex py-1 items-center gap-4">
                        <p className="text-sm font-medium">TDS</p>
                        <span>50 ppm</span>
                    </div>
                
            </div>
            <div className="bg-white p-2  rounded-md shadow-md">
                <h2 className="text-lg font-semibold ">Pump Properties</h2>
                <p className="text-sm font-medium ">Pump #1</p>
                <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-green-600">Running</span>
                </div>
                <div className="flex justify-between py-1 gap-2">
                    <span className="text-sm text-gray-600">Run Time</span>
                    <span className="text-sm font-medium">6 hr</span>
                </div>
            </div>


        </div>
    )
}

export default WaterProperty
