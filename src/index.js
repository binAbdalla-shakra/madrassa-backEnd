const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const madrassaRoutes = require('./routes/madrassaRoutes');
const branchRoutes = require('./routes/branchRoutes');
const roleRoutes = require('./routes/roleRoutes');
const userRoutes = require('./routes/userRoutes');
// const authRoutes = require('./routes/AuthRoutes');
const parentRoutes = require('./routes/parentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const groupRoutes = require('./routes/groupRoutes');
const lessonTrackingRoutes = require('./routes/lessonTrackingRoutes');



const customerRoutes = require('./routes/customerRoutes');

require('dotenv').config();

const app = express();
connectDB();

const allowedOrigins = [
  "http://localhost:3000",
  "https://madrassa-frontend.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());

app.use('/api/madrassa', madrassaRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/auth', authRoutes);

app.use('/api/parents', parentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/groups', groupRoutes);

// app.use('/api/lessons', lessonTrackingRoutes);
// app.use('/api/attendances', lessonTrackingRoutes);


app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/expense-types', require('./routes/expenseTypeRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/dashboard', require('./routes/DashboardRoutes'));

app.use('/api/fee', require('./routes/feeRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));





app.use('/api/customers', customerRoutes);
//app.use('/api/plans', planRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
