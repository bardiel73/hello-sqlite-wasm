importScripts("sqlite3.js");

const message_types = Object.freeze({
    MAIN_ENTER_TEXT: 0,
    MAIN_CLEAR_DB: 1,
    WORKER_DB_CONTENTS: 2,
});

function sqlog(...args) {
    let str = "INFO:SQLITE: ";
    args.forEach(arg => str += arg);
    console.log(str);
}

sqlite3InitModule().then(sqlite3 => {
    const db = new sqlite3.oo1.OpfsDb('/test.db');
    sqlog("OpfsDb named `test.db` opened...");

    db.exec('CREATE TABLE IF NOT EXISTS entries (text TEXT)');
    sqlog("table named `entries` opened...");

    const send_db_to_main = () => {
        const db_contents = db.exec('SELECT * FROM entries', { returnValue: 'resultRows' });
        self.postMessage({type: message_types.WORKER_DB_CONTENTS, payload: db_contents});
    };

    send_db_to_main();

    self.onmessage = e => {
        switch(e.data.type)
        {
        case message_types.MAIN_ENTER_TEXT:
            {
                sqlog(`message '${e.data.payload}' received...`);
                // console.log(e);
                db.exec({ sql: 'INSERT INTO entries (text) VALUES (?)', bind: [e.data.payload] });
                sqlog(`message '${e.data.payload}' inserted...`);

                const rows = db.exec('SELECT * FROM entries', { returnValue: 'resultRows' });
                // sqlog("current db: ", rows);
                send_db_to_main();

            } break;

            case message_types.MAIN_CLEAR_DB:
            {
                sqlog("MAIN_CLEAR_DB msg received...");
                db.exec({ sql: 'DELETE FROM entries' });
                // const rows = db.exec('SELECT * FROM entries', { returnValue: 'resultRows' });
                // sqlog("current db: ", rows);
                send_db_to_main();
            } break;
        } // switch(e.data.type)
    }; // self.onmessage
}); // sqlite3InitModule().then