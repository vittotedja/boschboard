"use client"

import React, { useState } from "react"
import { Calendar, Home, Inbox, Search, Settings, Menu, X, LayoutDashboard, ShieldAlert } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

type MenuItem = {
    title: string
    url: string
    icon: React.ElementType
}

const items: MenuItem[] = [
    { title: "Dashboard", url: "dashboard", icon: LayoutDashboard },
    { title: "Scheduling", url: "scheduling", icon: Calendar },
    { title: "Anomaly Detection", url: "simulator", icon: ShieldAlert },
]

export const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true) // Sidebar is open by default
    const [selectedItem, setSelectedItem] = useState<string | null>(null)

    const toggleSidebar = () => setIsOpen(!isOpen)

    const handleSelectItem = (title: string) => {
        setSelectedItem(title)
        // Add animation or routing logic here if needed.
    }

    return ( 
        <div className={`relative ${isOpen ? "w-64" : "w-24"} h-screen top-0 sticky bg-gray-100 text-white transition-all`}>
            <motion.div
                className="h-full flex flex-col"
                initial={{ width: 0 }}
                animate={{ width: isOpen ? 256 : 64 }}
                transition={{ duration: 0.3 }}
            >

                <div className="flex justify-between items-center p-4 mb-4">
                    {/* Logo with increased size */}
                    {isOpen && (
                        <motion.div 
                            className="p-2"
                            initial={{ opacity: 0, x: -20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ duration: 0.3 }}
                        >
                            <Image src="/image.png" alt="Logo" width={96} height={96} />
                        </motion.div>
                    )}

                    {/* <button onClick={toggleSidebar} className="text-white p-2">
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button> */}

                    <button className="text-primary p-2">
                         <Menu size={24} />
                    </button>
                </div>

                <div className="flex flex-col space-y-4 p-4">
                    {items.map((item) => (
                        <motion.a
                            key={item.title}
                            href={item.url}
                            className={`flex items-center space-x-4 text-black py-2 px-4 rounded-md ${
                                selectedItem === item.title ? "bg-sky-950 text-white font-bold" : ""
                            }`}
                            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectItem(item.title)}
                        >
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                transition={{ duration: 0.3 }}
                            >
                                <item.icon size={20} />
                            </motion.div>
                            {isOpen && (
                                <motion.span 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    transition={{ duration: 0.3 }}
                                >
                                    {item.title}
                                </motion.span>
                            )}
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
