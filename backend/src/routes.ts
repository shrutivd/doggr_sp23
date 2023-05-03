import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import { Match } from "./db/entities/Match.js";
import {Messages} from "./db/entities/Messages.js";
import {User} from "./db/entities/User.js";

import {ICreateUsersBody} from "./types.js";
import {IntegerType} from "@mikro-orm/core";
import {readFile}from "fs";

async function DoggrRoutes(app: FastifyInstance, _options = {}) {
	if (!app) {
		throw new Error("Fastify instance has no value during routes construction");
	}
	
	app.get('/hello', async (request: FastifyRequest, reply: FastifyReply) => {
		return 'hello';
	});
	
	app.get("/dbTest", async (request: FastifyRequest, reply: FastifyReply) => {
		return request.em.find(User, {});
	});
	

	
	// Core method for adding generic SEARCH http method
	// app.route<{Body: { email: string}}>({
	// 	method: "SEARCH",
	// 	url: "/users",
	//
	// 	handler: async(req, reply) => {
	// 		const { email } = req.body;
	//
	// 		try {
	// 			const theUser = await req.em.findOne(User, { email });
	// 			console.log(theUser);
	// 			reply.send(theUser);
	// 		} catch (err) {
	// 			console.error(err);
	// 			reply.status(500).send(err);
	// 		}
	// 	}
	// });
	
	// CRUD
	// C
	app.post<{Body: ICreateUsersBody}>("/users", async (req, reply) => {
		const { name, email, petType, isAdmin} = req.body;
		
		try {
			const newUser = await req.em.create(User, {
				name,
				email,
				petType,
				isAdmin
			});

			await req.em.flush();
			
			console.log("Created new user:", newUser);
			return reply.send(newUser);
		} catch (err) {
			console.log("Failed to create new user", err.message);
			return reply.status(500).send({message: err.message});
		}
	});
	
	//READ
	app.search("/users", async (req, reply) => {
		const { email } = req.body;
		
		try {
			const theUser = await req.em.findOne(User, { email });
			console.log(theUser);
			reply.send(theUser);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	
	// UPDATE
	app.put<{Body: ICreateUsersBody}>("/users", async(req, reply) => {
		const { name, email, petType} = req.body;
		
		const userToChange = await req.em.findOne(User, {email});
		userToChange.name = name;
		userToChange.petType = petType;
		
		// Reminder -- this is how we persist our JS object changes to the database itself
		await req.em.flush();
		console.log(userToChange);
		reply.send(userToChange);
		
	});

	
	// DELETE
	app.delete<{ Body: {email}}>("/users", async(req, reply) => {
		const { email } = req.body;
		
		try {
			const theUser = await req.em.findOne(User, { email });
			
			await req.em.remove(theUser).flush();
			console.log(theUser);
			reply.send(theUser);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	
	

	// CREATE MATCH ROUTE
	app.post<{Body: { email: string, matchee_email: string }}>("/match", async (req, reply) => {
		const { email, matchee_email } = req.body;

		try {
			// make sure that the matchee exists & get their user account
			const matchee = await req.em.findOne(User, { email: matchee_email });
			// do the same for the matcher/owner
			const owner = await req.em.findOne(User, { email });

			//create a new match between them
			const newMatch = await req.em.create(Match, {
				owner,
				matchee
			});

			//persist it to the database
			await req.em.flush();
			// send the match back to the user
			return reply.send(newMatch);
		} catch (err) {
			console.error(err);
			return reply.status(500).send(err);
		}

	});

 
	//send message
	// eslint-disable-next-line max-len
	app.post<{Body: {sender: string, receiver:string, message:string}}>("/messages", async (req, reply) => {
		//const{ receiver, message} = req.body;

		const sender_email = req.body.sender;
		const receiver_email = req.body.receiver;
		const message_data = req.body.message.toLowerCase();
		
		try {
			const filePath = '/home/d/workspace/doggr_sp23/backend/src/files/bad_word.txt';
			
			//make sure that the sender and receiver both exist and get their account
			readFile(filePath, 'utf8', function(err, data) {
				if (err) {
					console.error(`Error reading file: ${err}`);
					return reply.status(500).send(err);
				}
				
				const bad_word = data.split('\n');
				bad_word.pop(); // Removing last empty line
				
				for (const word_idx in bad_word) {
					const word = bad_word[word_idx].toLowerCase();
					if (message_data.includes(word)) {
						console.error("Inapropriate word found in your message, you are naughty");
						return reply.status(500).send("Inapropriate word found in your message, you are naughty");
					}
				}
				
			});
			//go to the database and look for the user whose email matches the sender_email
			const sender = await req.em.findOne(User, {email: sender_email});
				
			//go to the database and look for the user whose email matches the sender_email
			const receiver = await req.em.findOne(User, {email: receiver_email});
				
			//create new message
			const newMessage: Messages = await req.em.create(Messages, {
				sender,
				receiver,
				message_data
			});
				
			//save message to database
			await req.em.flush();
			return reply.send(newMessage);
				
		} catch (err) {
			console.error(err);
			return reply.status(500).send(err);
		}
		
	});


	app.search("/messages/sent", async (req, reply) => {
		const { sender } = req.body;

		try {
			//read all the messages I have sent
			//SELECT * FROM messages WHERE sender = 'current_user_id';

			if(sender!){
				//go to the database and look for messages from a particular user
				const sender_user = await req.em.findOne(User, {email: sender});
				const id_of_sender = sender_user.id;
				const message_log = await  req.em.find(Messages, {sender_id: id_of_sender});
				console.log(message_log);
				reply.send(message_log);
			}
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});


	app.search("/messages", async (req, reply) => {
		const { receiver } = req.body;

		try {
			if(receiver!){
				const receiver_user = await req.em.findOne(User, {email: receiver});
				const id_of_receiver = receiver_user.id;

				const message_log = await  req.em.find(Messages, {receiver_id: id_of_receiver});
				//const message_log = await req.em.findOne(Messages, {sender_email: email });

				console.log(message_log);
				reply.send(message_log);
			}
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});


	// UPDATE the sent message
	app.put<{Body: {messageId, message:string}}>("/messages", async(req, reply) => {

      try {
		  const id = req.body.messageId;
		  const message_data = req.body.message;

		  const messageToChange = await req.em.findOne(Messages, {id});
		  messageToChange.message_data = message_data;

		  // Reminder -- this is how we persist our JS object changes to the database itself
		  await req.em.flush();
		  console.log("Message updated");
		  reply.send(messageToChange);
	  }catch (err){
		  console.error(err);
		  reply.status(401).send(err);
	  }

	});



	// DELETE
	app.delete<{ Body: {messageId, password}}>("/messages", async(req, reply) => {

		const id = req.body.messageId;
		const password = req.body.password;

		try {
			const messageToDelete = await req.em.findOne(Messages, {id} );
			
			const sender = await req.em.findOne(User, {id: messageToDelete.sender.id});
			const receiver = await req.em.findOne(User, {id: messageToDelete.receiver.id});

			
			if(messageToDelete.sender.isAdmin == 'false' && messageToDelete.receiver.isAdmin == 'false'){
				console.error("Only admin can delete messages.");
				return reply.status(401).send("Only admin can delete messages");
			}

			if(password != "1997"){
				const incorrect_password = "Incorrect Password";
				console.error(incorrect_password);
				return reply.status(401).send(incorrect_password);
			}

			await req.em.remove(messageToDelete).flush();
			console.log("Message deleted");
			reply.send(messageToDelete);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});


	//Delete all
	app.delete<{Body: {sender, password}}>("/messages/all", async (req, reply) => {
		const { sender, password } = req.body;

		try {
			//go to the database and look for messages from a particular user
			const sender_user = await req.em.findOne(User, {email: sender});
			const message_log = await  req.em.find(Messages, {sender: sender_user});
			
			if(sender_user.isAdmin == "false"){
				console.error("Only admin can delete messages.");
				return reply.status(401).send("Only admin can delete messages");
			}
			
			
			if(password != process.env.PASSWORD){
				const incorrect_password = "Incorrect Password";
				console.error(incorrect_password);
				return reply.status(401).send(incorrect_password);
			}

			await req.em.remove(message_log).flush();
			console.log("Messages deleted");
			reply.send(message_log);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});



}

export default DoggrRoutes;
