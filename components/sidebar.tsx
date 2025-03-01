"use client";

import React, {useState} from "react";
import {
	Calendar,
	LayoutDashboard,
	ShieldAlert,
	Menu,
	BrainCircuit,
} from "lucide-react";
import {motion} from "framer-motion";
import Image from "next/image";
import {usePathname} from "next/navigation";
import Link from "next/link";

type MenuItem = {
	title: string;
	url: string;
	icon: React.ElementType;
};

const items: MenuItem[] = [
	{title: "Dashboard", url: "/", icon: LayoutDashboard},
	{title: "Scheduling", url: "/scheduling", icon: Calendar},
	{title: "Anomaly Detection", url: "/simulator", icon: ShieldAlert},
	{title: "AI Assistant", url: "/rag", icon: BrainCircuit},
];

export const Sidebar: React.FC = () => {
	const [isOpen, setIsOpen] = useState(true);
	const pathname = usePathname(); // Current route from Next.js

	const toggleSidebar = () => setIsOpen(!isOpen);

	return (
		<div
			className={`relative ${
				isOpen ? "w-64" : "w-20"
			} h-screen top-0 sticky bg-gray-100 text-white shadow-lg transition-all duration-300`}
		>
			<motion.div
				className="h-full flex flex-col justify-between"
				initial={{width: 0}}
				animate={{width: isOpen ? 256 : 80}}
				transition={{duration: 0.3}}
			>
				{/* Header - Logo & Toggle Button */}
				<div className="flex justify-between items-center p-4">
					{isOpen && (
						<motion.div
							className="p-2"
							initial={{opacity: 0, x: -20}}
							animate={{opacity: 1, x: 0}}
							transition={{duration: 0.3}}
						>
							<Image src="/image.png" alt="Logo" width={96} height={96} />
						</motion.div>
					)}
					<button onClick={toggleSidebar} className="text-primary p-2">
						<Menu size={24} />
					</button>
				</div>

				{/* Navigation Items */}
				<div className="flex-1 overflow-y-auto">
					<div className="flex flex-col space-y-4 p-4">
						{items.map((item) => {
							const isActive = pathname === item.url;
							return (
								<Link href={item.url} key={item.title}>
									<motion.div
										className={`flex items-center space-x-4 text-black py-2 px-4 rounded-md transition cursor-pointer ${
											isActive
												? "bg-sky-950 text-white font-bold"
												: "hover:bg-gray-200"
										}`}
										whileHover={{scale: 1.05, transition: {duration: 0.2}}}
										whileTap={{scale: 0.95}}
									>
										<motion.div
											initial={{opacity: 0, x: -10}}
											animate={{opacity: 1, x: 0}}
											transition={{duration: 0.3}}
										>
											<item.icon size={20} />
										</motion.div>
										{isOpen && (
											<motion.span
												initial={{opacity: 0, x: -10}}
												animate={{opacity: 1, x: 0}}
												transition={{duration: 0.3}}
											>
												{item.title}
											</motion.span>
										)}
									</motion.div>
								</Link>
							);
						})}
					</div>
				</div>

				{/* Footer */}
				<div className="mt-auto p-4 border-t border-gray-300">
					{isOpen ? (
						<div className="text-xs text-gray-600 space-y-1">
							<p>© {new Date().getFullYear()} Strawberry</p>
							<p>All rights reserved.</p>
						</div>
					) : (
						<div className="flex justify-center">
							<span className="text-xs text-gray-600">
								© {new Date().getFullYear()}
							</span>
						</div>
					)}
				</div>
			</motion.div>
		</div>
	);
};
