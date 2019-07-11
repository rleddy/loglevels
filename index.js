const loggerManager = require('./formatting.js')

loggerManager.setConfigLogLevel('info')

loggerManager.installGlobalLogger('testLogger',['wood','brass','string','voice','synth','guitar','bass','drumset'])

testLogger.info("seems that this works")


function someStackyFunction() {
    var eRr = new Error("this is a test of %d")
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