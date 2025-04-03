import Navbar from "../components/Layout/Navbar";
import MovieList from "../components/Movie/MovieList";
import HeroBanner from "../components/Movie/HeroBanner";

export default function Home() {
  return (
    <div className="bg-black text-white">
      <Navbar />
      <HeroBanner />
      <div className="container-fluid mt-5 px-4">
        <h5 className="mb-4" style={{ color: "#000000" }}></h5>
        <MovieList />
      </div>
      
      <style jsx global>{`
        body {
          background-color: #000;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
