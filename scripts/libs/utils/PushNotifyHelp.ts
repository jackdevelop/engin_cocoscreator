export class PushNotifyHelp{public static sendNotify(id:number,body:string,time:number){let last_login_device = '';if(cc.sys.isNative){else if(cc.sys.platform == cc.sys.ANDROID){last_login_device = jsb.reflection.callStaticMethod('org/cocos2dx/sscq/push/Push','sendNotify','(ILjava/lang/String;Ljava/lang/String;)V',id,body,time)}else{last_login_device = jsb.reflection.callStaticMethod('GameHelper','sendNotify')}}return last_login_device}}