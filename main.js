// tag::import[]
const { TypeDB } = require("typedb-driver/TypeDB");
const { SessionType } = require("typedb-driver/api/connection/TypeDBSession");
const { TransactionType } = require("typedb-driver/api/connection/TypeDBTransaction");
const { TypeDBOptions } = require("typedb-driver/api/connection/TypeDBOptions");
const { Concept } = require("typedb-driver/api/concept/Concept");
// end::import[]
async function main() {
    const DB_NAME = "manual_db";
    // tag::driver[]
    const driver = await TypeDB.coreDriver("127.0.0.1:1729");
    // end::driver[]
    // tag::list-db[]
    let dbs = await driver.databases.all();
    for (db of dbs) {
        console.log(db.name);
    }
    // end::list-db[]
    // tag::delete-db[]
    if (await driver.databases.contains(DB_NAME)) {
        await (await driver.databases.get(DB_NAME)).delete();
    }
    // end::delete-db[]
    // tag::create-db[]
    await driver.databases.create(DB_NAME);
    // end::create-db[]
    if (driver.databases.contains(DB_NAME)) {
        console.log("Database setup complete.");
    }
    // tag::define[]
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const define_query = `
                                define
                                email sub attribute, value string;
                                name sub attribute, value string;
                                friendship sub relation, relates friend;
                                user sub entity,
                                    owns email @key,
                                    owns name,
                                    plays friendship:friend;
                                admin sub user;
                                `;
            await tx.query.define(define_query);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::define[]
    // tag::undefine[]
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const undefine_query = "undefine admin sub user;";
            await tx.query.undefine(undefine_query);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::undefine[]
    // tag::insert[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const insert_query = `
                                insert
                                $user1 isa user, has name "Alice", has email "alice@vaticle.com";
                                $user2 isa user, has name "Bob", has email "bob@vaticle.com";
                                $friendship (friend:$user1, friend: $user2) isa friendship;
                                `;
            await tx.query.insert(insert_query);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::insert[]
    // tag::match-insert[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const match_insert_query = `
                                match
                                $u isa user, has name "Bob";
                                insert
                                $new-u isa user, has name "Charlie", has email "charlie@vaticle.com";
                                $f($u,$new-u) isa friendship;
                                `;
            let response = await tx.query.insert(match_insert_query).collect();
            if (response.length == 1) {
                await tx.commit();
            }
            else {await tx.close();}
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::match-insert[]
    // tag::delete[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const delete_query = `
                                match
                                $u isa user, has name "Charlie";
                                $f ($u) isa friendship;
                                delete
                                $f isa friendship;
                                `;
            await tx.query.delete(delete_query);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::delete[]
    // tag::update[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const update_query = `
                                match
                                $u isa user, has name "Charlie", has email $e;
                                delete
                                $u has $e;
                                insert
                                $u has email "charles@vaticle.com";
                                `;
            let response = await tx.query.update(update_query).collect();
            if (response.length == 1) {
                await tx.commit();
            }
            else {await tx.close();}
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::update[]
    // tag::fetch[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.READ);
            const fetch_query = `
                                match
                                $u isa user;
                                fetch
                                $u: name, email;
                                `;
            let response = await tx.query.fetch(fetch_query).collect();
            for (let i = 0; i < response.length; i++) {
                console.log("User #" + (i + 1) + ": " + JSON.stringify(response[i], null, 4));
            }
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::fetch[]
    // tag::get[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.READ);
            const get_query = `
                                match
                                $u isa user, has email $e;
                                get
                                $e;
                                `;
            let response = await tx.query.get(get_query).collect();
            for (let i = 0; i < response.length; i++) {
                console.log("Email #" + (i + 1) + ": " + response[i].get("e").value);
            }
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::get[]
    // tag::infer-rule[]
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            const define_query = `
                                define
                                rule users:
                                when {
                                    $u isa user;
                                } then {
                                    $u has name "User";
                                };
                                `;
            await tx.query.define(define_query);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::infer-rule[]
    // tag::infer-fetch[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            let options = new TypeDBOptions();
            options.infer = true;
            tx = await session.transaction(TransactionType.READ, options);
            const fetch_query = `
                                match
                                $u isa user;
                                fetch
                                $u: name, email;
                                `;
            let response = await tx.query.fetch(fetch_query).collect();
            for(let i = 0; i < response.length; i++) {
                console.log("User #" + (i + 1) + ": " + JSON.stringify(response[i], null, 4));
            }
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::infer-fetch[]
    // tag::types-editing[]
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            let tag = await tx.concepts.putAttributeType("tag", Concept.ValueType.STRING);
            let rootEntity = await tx.concepts.getRootEntityType();
            let entites = await rootEntity.getSubtypes(tx, Concept.Transitivity.EXPLICIT);
            await entites.forEach(entity => entity.setOwns(tx, tag));
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::types-editing[]
    // tag::types-api[]
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            let user = await tx.concepts.getEntityType("user");
            let admin = await tx.concepts.putEntityType("admin");
            await admin.setSupertype(tx, user);
            let rootEntity = await tx.concepts.getRootEntityType();
            let subtypes = await rootEntity.getSubtypes(tx, Concept.Transitivity.TRANSITIVE);
            await subtypes.forEach(subtype => console.log(subtype.label.toString()));
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::types-api[]
    // tag::rules-api[]
    try {
        session = await driver.session(DB_NAME, SessionType.SCHEMA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            for await (const rule of tx.logic.getRules()) {
                console.log("Rule label: " + rule.label);
                console.log("  Condition: " + rule.when);
                console.log("  Conclusion: " + rule.then);
            }    
            let new_rule = await tx.logic.putRule("Employee","{$u isa user, has email $e; $e contains '@vaticle.com';}","$u has name 'Employee'");
            console.log((await tx.logic.getRule("Employee")).label);
            await new_rule.delete(tx);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::rules-api[]
    // tag::data-api[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            tx = await session.transaction(TransactionType.WRITE);
            let userType = await tx.concepts.getEntityType("user");
            let users = userType.getInstances(tx);
            for await (const user of users) {
                let attributes = user.getHas(tx);
                console.log("User:");
                for await (const attribute of attributes) {
                    console.log(" " + attribute.type.label.toString() + ": " + attribute.value.toString());
                }
            }
            let newUser = await (await tx.concepts.getEntityType("user")).create(tx);
            await newUser.delete(tx);
            await tx.commit();
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::data-api[]
    // tag::explain-get[]
    try {
        session = await driver.session(DB_NAME, SessionType.DATA);
        try {
            let options = new TypeDBOptions();
            options.infer = true;
            options.explain = true;
            tx = await session.transaction(TransactionType.READ, options);
            const get_query = `
                                match
                                $u isa user, has email $e, has name $n;
                                $e contains 'Alice';
                                get
                                $u, $n;
                                `;
            let response = await tx.query.get(get_query).collect();
            for(let i = 0; i < response.length; i++) {
                console.log("Name #" + (i + 1) + ": " + response[i].get("n").value);
                let explainable_relations = await response[i].explainables.relations;
                for await (const explainable of explainable_relations) {
                    console.log("Explainable part of the query: " + explainable.conjunction())
                    explain_iterator = tx.query.explain(explainable);
                    for (explanation of explain_iterator) {
                        console.log("Rule: " + explanation.rule.label)
                        console.log("Condition: " + explanation.condition.toString())
                        console.log("Conclusion " + explanation.conclusion.toString())
                        for (qvar of explanation.variableMapping.keys()) {
                            console.log("Query variable " + qvar + " maps to the rule variable " + explanation.variableMapping.get(qvar))
                        }
                    }
                }
            } 
        }
        finally {if (tx.isOpen()) {await tx.close()};}
    }
    finally {await session?.close();}
    // end::explain-get[]
};

main();
