export default async function handler(req, res) {
    if (req.method === 'POST') {
        res.setHeader('Set-Cookie', 'token=; Max-Age=0; Path=/; HttpOnly');

        res.status(200).json({ message: 'Logged out successfully' });
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}