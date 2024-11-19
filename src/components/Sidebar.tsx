export default function Sidebar(){

  return (
    <div className="fixed left-0 top-0 w-64 h-full bg-[#f8f4f3] p-4 z-50 transition-transform md:block">
        <a
          href="/dash"
          className="flex items-center pb-4 border-b border-b-gray-800 justify-center"
        >
          <h2 className="font-bold text-2xl ">
            Stock{" "}
            <span className="bg-[#f84525] text-white px-2 rounded-md">
              Verse
            </span>
          </h2>
        </a>
        <div className="flex flex-row pt-8 pb-4">
          <div className="mx-auto">
            <div className="bg-white rounded-xl shadow-lg mb-6 px-6 py-4">
              <a
                href="/dash"
                className="inline-block text-gray-600 hover:text-black my-4 w-full"
              >
                Panel
              </a>
              <a
                href="/personal"
                className="inline-block text-gray-600 hover:text-black my-4 w-full"
              >
                Personal
              </a>
              <a
                href="/stocks"
                className="inline-block text-gray-600 hover:text-black my-4 w-full"
              >
                Stocks
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-lg mb-6 px-6 py-4">
              <a
                href="/profile"
                className="inline-block text-gray-600 hover:text-black my-4 w-full"
              >
                Profile
              </a>
              <a
                href="/logout"
                className="inline-block text-gray-600 hover:text-black my-4 w-full"
              >
                Log out
              </a>
            </div>
          </div>
        </div>
      </div>
  );
}