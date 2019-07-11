# loglevels
A simple wrapper of winston that provides management of a set of variables for loging in contexts


requires winstons

Provides an easy interface for making sure that the logger can be a global variable of your choice. 
The logger wrapper class has a clone method so that different contexts can work with a different set of values. 

The fields to be logged are decided at the creation time of the logger. 

Here is an example:

```
const loggerManager = require('./formatting.js')

loggerManager.setConfigLogLevel('info')

loggerManager.installGlobalLogger('testLogger',['wood','brass','string','voice','synth','guitar','bass','drumset'])

testLogger.info("seems that this works")

var eRr = new Error("this is a test of %d")

function someStackyFunction() {
    testLogger.alert(eRr,2)
}

someStackyFunction()


testLogger.setHost()
testLogger.setProcessId()

var alpha = testLogger.clone()

alpha.setValue('wood','flute')
alpha.setValue('brass','trumpet')
alpha.setValue('string','violin')
alpha.setValue('voice','grandma')
alpha.setValue('bass','standup')
alpha.setValue('noise','nada nix')

var age = 92
alpha.warning("don't put %d years old Grandma on the stage!",age)
```
