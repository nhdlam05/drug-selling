db = db.getSiblingDB('db_drug');  // Switch to the "dev" database.

db.temp.insert({});  // Create a temporary collection to initialize the database.

db.createUser(
    {
        user: "admin",
        pwd: "password",
        roles: [
            {
                role: "readWrite",
                db: "db_drug"
            }
        ]
    }
);