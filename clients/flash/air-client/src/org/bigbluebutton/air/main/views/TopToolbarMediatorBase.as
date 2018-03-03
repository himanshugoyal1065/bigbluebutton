package org.bigbluebutton.air.main.views {
	import flash.events.MouseEvent;
	
	import org.bigbluebutton.air.main.models.IConferenceParameters;
	import org.bigbluebutton.air.main.models.IMeetingData;
	
	import robotlegs.bender.bundles.mvcs.Mediator;
	
	public class TopToolbarMediatorBase extends Mediator {
		
		[Inject]
		public var view:TopToolbarBase;
		
		[Inject]
		public var meetingData:IMeetingData;
		
		[Inject]
		public var conferenceParameters:IConferenceParameters;
		
		override public function initialize():void {
			view.leftButton.addEventListener(MouseEvent.CLICK, leftButtonClickHandler);
			view.rightButton.addEventListener(MouseEvent.CLICK, rightButtonClickHandler);
			meetingData.meetingStatus.recordingStatusChangedSignal.add(onRecordingStatusChanged);
			
			setVisibility()
			setTitle();
			view.showRecording(meetingData.meetingStatus.isRecording);
		}
		
		protected function setTitle():void {
			view.titleLabel.text = conferenceParameters.meetingName;
		}
		
		protected function setVisibility():void {
		}
		
		protected function leftButtonClickHandler(e:MouseEvent):void {
		
		}
		
		protected function rightButtonClickHandler(e:MouseEvent):void {
		
		}
		
		protected function onRecordingStatusChanged(isRecording:Boolean):void {
			view.showRecording(isRecording);
		}
		
		override public function destroy():void {
			view.leftButton.removeEventListener(MouseEvent.CLICK, leftButtonClickHandler);
			view.rightButton.removeEventListener(MouseEvent.CLICK, rightButtonClickHandler);
			meetingData.meetingStatus.recordingStatusChangedSignal.remove(onRecordingStatusChanged);
			
			super.destroy();
			view = null;
		}
	}
}
