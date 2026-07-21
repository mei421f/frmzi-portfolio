const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'change_this_to_a_long_random_string';

function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'دسترسی غیرمجاز' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (!decoded.admin) throw new Error('not admin');
    next();
  } catch {
    return res.status(401).json({ message: 'توکن نامعتبر یا منقضی شده است' });
  }
}

module.exports = { adminAuth, SECRET };
