def apply_fix():
    with open(r"C:\Users\ASUS\ethio-hub-new\src\app\event\[id]\transport\page.tsx", "r") as f:
        content = f.read()

    # 1. Add Gauge import
    content = content.replace(
        "import { ArrowLeft, Car, Users, Check } from 'lucide-react';",
        "import { ArrowLeft, Car, Users, Check, Gauge } from 'lucide-react';"
    )

    # 2. Replace vehicle specifications in the list view
    old_list = '''                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Type</p>
                              <p className="text-sm font-semibold text-gray-800">{transport.type}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Seats</p>
                              <p className="text-sm font-semibold text-gray-800">{transport.capacity || 5}</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Fuel</p>
                              <p className="text-sm font-semibold text-gray-800">Petrol/Diesel</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Transmission</p>
                              <p className="text-sm font-semibold text-gray-800">Automatic</p>
                            </div>
                          </div>'''

    new_list = '''                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl bg-gray-50 p-3">
                              <Gauge className="w-6 h-6 text-gray-400 mb-2" />
                              <h3 className="font-bold text-gray-900">{transport.availability != null ? transport.availability : 'Not set'}</h3>
                              <p className="text-sm text-gray-500">Available Units</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <CarFront className="w-6 h-6 text-gray-400 mb-2" />
                              <h3 className="font-bold text-gray-900">{transport.type}</h3>
                              <p className="text-sm text-gray-500">Vehicle Type</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <Users className="w-6 h-6 text-gray-400 mb-2" />
                              <h3 className="font-bold text-gray-900">{transport.capacity || 5}</h3>
                              <p className="text-sm text-gray-500">Passenger Capacity</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <Fuel className="w-6 h-6 text-gray-400 mb-2" />
                              <h3 className="font-bold text-gray-900">Petrol/Diesel</h3>
                              <p className="text-sm text-gray-500">Fuel Type</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3">
                              <Wind className="w-6 h-6 text-gray-400 mb-2" />
                              <h3 className="font-bold text-gray-900">Automatic</h3>
                              <p className="text-sm text-gray-500">Transmission</p>
                            </div>
                          </div>'''

    content = content.replace(old_list, new_list)

    # 3. Add availability display in transport list items
    old_display = """                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {transport.capacity} seats
                            </div>"""

    new_display = """                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span className="font-medium">{transport.availability != null ? transport.availability + ' units' : 'Not set'}</span>
                              {transport.availability === 0 && (
                                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Sold Out</span>
                              )}
                            </div>"""

    content = content.replace(old_display, new_display)

    print("Fix applied!")

apply_fix()
