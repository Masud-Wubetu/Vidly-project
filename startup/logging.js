require('express-async-errors');
const winston =  require('winston');
require('winston-mongodb');

module.exports = function() {
    winston.exceptions.handle(
        new winston.transports.File({ filename: 'uncaughtExceptions.log'}),
        new winston.transports.Console()
    );
    
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

    
    winston.add(
        new winston.transports.File({ 
            filename: 'logfile.log' ,
            level: 'info'
        })
    );

    winston.add(
        new winston.transports.Console({
            level: 'info',
            format: winston.format.simple()
        })
  );

    winston.add(new winston.transports.MongoDB({ 
        db: 'mongodb://localhost/vidly',
        level: 'error'
    }));
    
}