from Foundation import NSObject
from AppKit import NSWorkspace, NSWorkspaceDidWakeNotification
import subprocess
from PyObjCTools import AppHelper

class WakeHandler(NSObject):
    def wakeUp_(self, notification):
        subprocess.run(["curl", "-s", "-X", "POST", "http://localhost:5678/webhook/contest-check"])

handler = WakeHandler.alloc().init()
NSWorkspace.sharedWorkspace().notificationCenter().addObserver_selector_name_object_(
    handler, "wakeUp:", NSWorkspaceDidWakeNotification, None
)
AppHelper.runConsoleEventLoop()
