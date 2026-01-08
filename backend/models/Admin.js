import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String }
});

AdminSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

AdminSchema.methods.comparePassword = function (pw) {
    return bcrypt.compare(pw, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);
export default Admin;