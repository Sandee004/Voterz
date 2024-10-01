import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 px-5 py-2 flex flex-row justify-between items-center sm:px-8">
        <button className="sm:hidden" onClick={toggleMenu}>
          <Menu className="text-white text-xl" />
        </button>
        <p className="text-2xl font-bold text-white">Voterz</p>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-[49px] left-0 right-0 z-40 bg-green-500 flex flex-col pl-8 py-4"
          >
            <Link className="py-2 hover:font-bold w-[80%]" to="/">
              Home
            </Link>
            <Link className="py-2 hover:font-bold w-[80%]" to="/favourites">
              Favourites
            </Link>
            <Link to="/login">Login</Link>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-[52px]"></div>{" "}
      {/* Spacer to prevent content from being hidden under the fixed navbar */}
    </>
  );
};

export default Navbar;
