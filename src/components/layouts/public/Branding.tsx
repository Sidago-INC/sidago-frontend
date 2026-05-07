import React from "react";
import { motion } from "framer-motion";

export default function Branding() {
  return (
    <motion.div
      className="hidden md:flex md:w-5/12 lg:w-1/2 p-12 lg:p-24 flex-col justify-center bg-[#f2f3ff] relative overflow-hidden"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <div className="relative z-10">
        <motion.h1
          className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-indigo-900 leading-[1.1] mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Customer
          <br />
          Growth
        </motion.h1>
        <motion.p
          className="text-slate-600 text-lg max-w-md leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          Organize your pipeline, automate workflows, and close deals faster.
        </motion.p>
      </div>
    </motion.div>
  );
}
