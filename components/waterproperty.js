import React from 'react'

const WaterProperty = ({pumprate,pump,inletflow,inltettds,outletflow,outlettds,rejectflow,rejecttds}) => {
    return (
        <div className="flex flex-wrap justify-between gap-2 bg-white">
            {/* Operator Info */}
            <div className="flex-1 min-w-[200px] p-2 bg-white rounded-md shadow-md">
                <p className="text-lg font-medium">Operator Info</p>
                <div className="flex py-1 gap-2 justify-between items-center">
                    <p className="text-sm font-medium">Name</p>
                    <span>Ramesh Lal</span>
                </div>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">Current Shift</p>
                    <span>A</span>
                </div>
            </div>

            {/* Inlet Properties */}
            <div className="flex-1 min-w-[200px] p-2 bg-white rounded-md shadow-md">
                <p className="text-lg font-medium">Inlet Properties</p>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">Flow Rate</p>
                    <span>{inletflow} L/hr</span>
                </div>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">TDS</p>
                    <span>{inltettds} ppm</span>
                </div>
            </div>

            {/* Reject Properties */}
            <div className="flex-1 min-w-[200px] p-2 bg-white rounded-md shadow-md">
                <p className="text-lg font-medium">Reject Properties</p>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">Flow Rate</p>
                    <span>{rejectflow} L/hr</span>
                </div>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">TDS</p>
                    <span>{rejecttds} ppm</span>
                </div>
            </div>

            {/* Outlet Properties */}
            <div className="flex-1 min-w-[200px] p-2 bg-white rounded-md shadow-md">
                <p className="text-lg font-medium">Outlet Properties</p>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">Flow Rate</p>
                    <span>{outletflow} L/hr</span>
                </div>
                <div className="flex py-1 justify-between items-center">
                    <p className="text-sm font-medium">TDS</p>
                    <span>{outlettds} ppm</span>
                </div>
            </div>

            {/* Pump Properties */}
            <div className="flex-1 min-w-[200px] p-2 bg-white rounded-md shadow-md">
                <p className="text-lg font-medium">Pump Properties</p>
                <p className="text-sm font-medium">Pump #1</p>
                <div className="flex py-1 justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-green-600">{pump?'Running':'Stopped'}</span>
                </div>
                <div className="flex py-1 justify-between">
                    <span className="text-sm text-gray-600">Run Time</span>
                    <span className="text-sm font-medium">{pumprate} hr</span>
                    
                </div>
            </div>
        </div>
    )
}

export default WaterProperty
