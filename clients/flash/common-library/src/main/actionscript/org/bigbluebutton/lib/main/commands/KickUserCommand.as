package org.bigbluebutton.lib.main.commands {
	import org.bigbluebutton.lib.user.models.User2x;
	import org.bigbluebutton.lib.user.services.IUsersService;
	
	import robotlegs.bender.bundles.mvcs.Command;
	
	public class KickUserCommand extends Command {
		
		[Inject]
		public var userService:IUsersService;
		
		[Inject]
		public var user:User2x;
		
		override public function execute():void {
			userService.kickUser(user.intId);
		}
	}
}
