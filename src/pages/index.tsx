import Link from "next/link";

const HomePage = () => {
  return (
    <div className="font-inter text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-8 flex justify-between items-center fixed w-full z-[99]">
        <a
          href="/"
          className="text-2xl font-bold text-gray-800 flex items-center"
        >
          Stock{" "}
          <span className="ml-1 bg-indigo-500 text-white px-2 py-1 rounded-lg">
            Verse
          </span>
        </a>

        <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md">
          Get Started
        </Link>
      </nav>

      <header className="relative bg-white text-center min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-gray-100 to-white"></div>

        {/* Decorative Circle Elements */}
        <div className="absolute top-16 left-8 w-44 h-44 rounded-full bg-blue-100 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-16 right-8 w-64 h-64 rounded-full bg-purple-100 opacity-50 blur-3xl"></div>

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-6">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Simplify <span className="text-blue-500">Stock Management</span>{" "}
            Like Never Before
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            StockVerse empowers you with intuitive tools to monitor, analyze,
            and grow your portfolio seamlessly. All in one place.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex justify-center gap-4">
            <Link
              href="#"
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300"
            >
              Get Started for Free
            </Link>
            <Link
              href="#features"
              className="bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-300 transition-all duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute border-t border-gray-200 top-[10%] left-0 w-1/2"></div>
          <div className="absolute border-b border-gray-200 bottom-[10%] right-0 w-1/2"></div>
        </div>
      </header>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 bg-white relative overflow-hidden"
      >
        {/* Decorative Background Gradients */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-30 -z-10"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10"></div>

        <div className="max-w-7xl mx-auto px-6">
          {/* Section Title */}
          <h3 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 mb-16 leading-snug">
            Explore <span className="text-blue-500">Key Features</span> of
            StockVerse
          </h3>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="p-8 text-center bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center">
                  {/* Icon Placeholder */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h11M9 21V3m12 12H9m6 6V9"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Real-Time Data
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Access live stock prices and portfolio updates instantly with
                zero delays.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 text-center bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-500 text-white flex items-center justify-center">
                  {/* Icon Placeholder */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 9.75L15 12l-5.25 2.25M7.5 7.5v9m9-9v9"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Advanced Analytics
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Visualize and analyze stocks with sleek, intuitive charts and
                in-depth insights.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 text-center bg-gray-50 rounded-2xl shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center">
                  {/* Icon Placeholder */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11c0-2.28 1.72-4 4-4s4 1.72 4 4-1.72 4-4 4-4-1.72-4-4zM3 21v-6a9 9 0 0118 0v6"
                    />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-3">
                Secure Platform
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Keep your data safe with end-to-end encryption and advanced
                security protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-10 left-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-40 -z-10"></div>
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-40 -z-10"></div>

        <div className="max-w-6xl mx-auto px-6 flex flex-col-reverse lg:flex-row items-center gap-12">
          {/* Left: Text Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h3 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 leading-tight">
              About <span className="text-blue-500">StockVerse</span>
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              StockVerse is the ultimate platform for investors and traders to
              manage their stock portfolios effortlessly. Whether you’re a
              beginner or a pro, our cutting-edge tools help you monitor trends,
              optimize strategies, and achieve long-term growth.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Experience real-time analytics, insightful data, and a seamless
              interface designed for success in every market condition.
            </p>
          </div>

          {/* Right: Image */}
          <div className="w-full">
            <div className="relative mx-auto max-w-sm lg:max-w-md">
              <img
                src="https://source.unsplash.com/featured/?stocks,technology"
                alt="About StockVerse"
                className="rounded-2xl shadow-2xl"
              />
              {/* Decorative Badge */}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50 relative overflow-hidden">
  {/* Decorative Background */}
  <div className="absolute top-0 left-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10"></div>
  <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>

  <div className="max-w-6xl mx-auto px-6">
    {/* Section Header */}
    <h3 className="text-4xl md:text-5xl font-extrabold text-center mb-16 text-gray-900 leading-tight">
      What Our <span className="text-blue-500">Users Say</span>
    </h3>

    {/* Testimonials Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Testimonial 1 */}
      <div className="p-6 bg-white rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300">
        <p className="text-gray-600 italic mb-4 leading-relaxed">
          "StockVerse completely changed how I manage my investments!"
        </p>
        <div className="flex items-center gap-4">
          <img
            src="https://i.pravatar.cc/150?img=10"
            alt="Alex M"
            className="w-12 h-12 rounded-full"
          />
          <h4 className="font-semibold text-gray-800 text-lg">Alex M.</h4>
        </div>
      </div>

      {/* Testimonial 2 */}
      <div className="p-6 bg-white rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300">
        <p className="text-gray-600 italic mb-4 leading-relaxed">
          "The analytics tools are so powerful and easy to use."
        </p>
        <div className="flex items-center gap-4">
          <img
            src="https://i.pravatar.cc/150?img=20"
            alt="Sarah W"
            className="w-12 h-12 rounded-full"
          />
          <h4 className="font-semibold text-gray-800 text-lg">Sarah W.</h4>
        </div>
      </div>

      {/* Testimonial 3 */}
      <div className="p-6 bg-white rounded-2xl shadow-lg hover:scale-105 transition-transform duration-300">
        <p className="text-gray-600 italic mb-4 leading-relaxed">
          "I love the real-time updates. Best investment app out there."
        </p>
        <div className="flex items-center gap-4">
          <img
            src="https://i.pravatar.cc/150?img=30"
            alt="John K"
            className="w-12 h-12 rounded-full"
          />
          <h4 className="font-semibold text-gray-800 text-lg">John K.</h4>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex justify-between">
          <div>
            <h4 className="text-2xl font-bold mb-4">StockVerse</h4>
            <p>Your ultimate stock management platform.</p>
          </div>
          <div>
            <h5 className="text-lg font-semibold mb-4">Follow Us</h5>
            <ul className="flex space-x-4">
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-400 transition">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-8 text-gray-400">
          &copy; {new Date().getFullYear()} StockVerse. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
