const express = require("express");
const router = express.Router();
const Users = require("../model/User.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "./uploads");
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname));
	},
});

const upload = multer({ storage: storage });

router.post("/signup", upload.single("image"), async (req, res) => {
	const { fname, lname, email, password, cpassword } = req.body;
	const image = req.file ? req.file.filename : null;
	try {
		const userExist = await Users.findOne({ email: email });
		if (userExist) {
			return res.status(422).send({ message: "Email is already exist." });
		} else if (password !== cpassword) {
			return res
				.status(422)
				.send({ message: "Password is not matched." });
		} else {
			const user = new Users({
				fname,
				lname,
				email,
				password,
				cpassword,
				image,
			});
			await user.save();
			return res
				.status(200)
				.json({ message: "User Created Successfully" });
		}
	} catch (error) {
		console.log(error);
	}
});

router.post("/signin", async (req, res) => {
	const { email, password } = req.body;
	try {
		let token;
		if (!email || !password) {
			return res.status(400).json({ error: "Please fill the required fields" });
		}
		const emailExist = await Users.findOne({ email: email });
		if (emailExist) {
			const passMatch = await bcrypt.compare(
				password,
				emailExist.password
			);
			if (!passMatch) {
				res.status(400).json({ error: "Password is not correct" });
			} else {
				token = await emailExist.generateAuthToken();
				res.json({
					message: "Login Successfully",
					data: { token, emailExist },
				});
			}
		} else {
			res.status(400).json({ error: "Wrong Email" });
		}
	} catch (error) {
		console.log(error);
	}
});

router.put("/updateuser/:id", upload.single("image"), async (req, res) => {
	try {
		const { fname, lname, email, password, cpassword } = req.body;
		let image = req.body.image; 
		if (req.file) {
			image = req.file.filename;
		}
		if (password !== cpassword) {
			return res
				.status(422)
				.send({ message: "Password is not matched." });
		} else {
			const passwordhash = await bcrypt.hash(password, 12);
			const cpasswordhash = await bcrypt.hash(cpassword, 12);

			const user = await Users.findByIdAndUpdate(
				req.params.id,
				{
					$set: {
						fname,
						lname,
						email,
						password: passwordhash,
						cpassword: cpasswordhash,
						image,
					},
				},
				{ new: true }
			);

			res.json(user);
		}
	} catch (error) {
		console.log(error);
	}
});

module.exports = router;
