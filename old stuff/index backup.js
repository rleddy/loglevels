const winston = require('winston')
const { combine, timestamp, label, json } = winston.format;


/*
DEFAULT - The log entry has no assigned severity level.
DEBUG - Debug or trace information.
INFO - Routine information, such as ongoing status or performance.
NOTICE - Normal but significant events, such as start up, shut down, or a configuration change.
WARNING - Warning events might cause problems.
ERROR - Error events are likely to cause problems.
CRITICAL - Critical events cause more severe problems or outages.
ALERT - A person must take an action immediately.
EMERGENCY       - One or more systems are unusable.
*/

const G_cloud_levels = {
    "emergency" : 0, 
    "alert" : 1,
    "critical" : 2,
    "error" : 3,
    "warning" : 4,
    "notice" : 5,
    "info" : 6,
    "debug" : 7,
    "default" : 8,
    "silly" : 9
}


const logger = winston.createLogger({
    level: 'info',
    levels: G_cloud_levels, 
    format: combine(timestamp(),json()),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

  var e = new Error("trace this stack")


logger.info('Hello again distributed logs', { "albatross" : false, "gremlin" : false} );
logger.critical('This gets printed, too.', { "albatross" : true, "gremlin" : true, "error" : e.stack } );
logger.warning('This gets printed, too.', { "albatross" : true, "gremlin" : false} );
logger.notice('This gets printed, too.', { "albatross" : false} );
