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
	app.post<{Body: {sender_email: string, receiver_email:string, message_data:string}}>("/messages", async (req, reply) => {
		const{sender_email, receiver_email, message_data} = req.body;
		
		try {
			const filePath = '/home/d/workspace/doggr_sp23/backend/src/files/bad_word.txt';
			
			//make sure that the sender and receiver both exist and get their account
			readFile(filePath, 'utf8', function(err, data) {
				if (err) {
					console.error(`Error reading file: ${err}`);
					return reply.status(500).send(err);
				}
				
				const our_names = data.split('\n');
				our_names.pop(); // Removing last empty line
				
				for (const word_idx in our_names) {
					const word = our_names[word_idx];
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
	
	
	

	app.search("/messages", async (req, reply) => {
		const { sender_email, receiver_email } = req.body;
		
		try {
			//read all the messages I have sent
			//SELECT * FROM messages WHERE sender = 'current_user_id';

			if(sender_email!){
				//go to the database and look for messages from a particular user
				const sender = await req.em.findOne(User, {email: sender_email});
				const id_of_sender = sender.id;

				const message_log = await  req.em.find(Messages, {sender_id: id_of_sender});
				//const message_log = await req.em.findOne(Messages, {sender_email: email });

				console.log(message_log);
				reply.send(message_log);
			}
			//read all the messages sent to me
			//SELECT * FROM messages WHERE receiver = 'current_user_id';

			if(receiver_email!){
				const receiver = await req.em.findOne(User, {email: receiver_email});
				const id_of_receiver = receiver.id;

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
	app.put<{Body: {id, message_data:string}}>("/messages", async(req, reply) => {
		const { id, message_data} = req.body;

		const messageToChange = await req.em.findOne(Messages, {id});
		messageToChange.message_data = message_data;

		// Reminder -- this is how we persist our JS object changes to the database itself
		await req.em.flush();
		console.log(messageToChange);
		reply.send(messageToChange);

	});



	// DELETE
	app.delete<{ Body: {id, password}}>("/messages", async(req, reply) => {
		const { id, password } = req.body;

		try {
			const messageToDelete = await req.em.findOne(Messages, {id} );
			
			const sender = await req.em.findOne(User, {id: messageToDelete.sender.id});
			
			///go to the database and look for the user whose email matches the sender_email
			const receiver = await req.em.findOne(User, {id: messageToDelete.receiver.id});
			
			console.log("sender is admin:", sender.isAdmin);
			console.log("receiver is admin:", receiver.isAdmin);
			
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
			console.log(messageToDelete);
			reply.send(messageToDelete);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});


	//Delete all
	app.delete<{Body: {sender_email, password}}>("/messages/all", async (req, reply) => {
		const { sender_email, password } = req.body;

		try {
			//go to the database and look for messages from a particular user
			const sender = await req.em.findOne(User, {email: sender_email});

			const message_log = await  req.em.find(Messages, {sender: sender});
			
			if(sender.isAdmin == 'false'){
				console.error("Only admin can delete messages.");
				return reply.status(401).send("Only admin can delete messages");
			}
			
			
			if(password != "1997"){
				const incorrect_password = "Incorrect Password";
				console.error(incorrect_password);
				return reply.status(401).send(incorrect_password);
			}

			await req.em.remove(message_log).flush();
			console.log(message_log);
			reply.send(message_log);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});


	//Bad word filter
	


	
}

export default DoggrRoutes;
