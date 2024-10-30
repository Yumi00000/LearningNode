import mongoose from 'mongoose';

import usersSchema from "../schemas/users.js";
import {Collections} from '../constants.js'

const Users = mongoose.model(Collections.USERS, usersSchema);

export default Users;