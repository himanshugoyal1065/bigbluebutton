package org.bigbluebutton.air.screenshare.views {
	import flash.events.AsyncErrorEvent;
	import flash.events.NetStatusEvent;
	import flash.events.StageVideoAvailabilityEvent;
	import flash.events.StageVideoEvent;
	import flash.geom.Rectangle;
	import flash.media.StageVideo;
	import flash.media.StageVideoAvailability;
	import flash.net.NetConnection;
	import flash.net.NetStream;
	
	import spark.components.Group;
	
	public class ScreenshareDock extends Group {
		private var ns:NetStream;
		
		private var _conn:NetConnection;
		
		private var _streamId:String;
		
		private var _width:int;
		
		private var _height:int;
		
		private var _sv:StageVideo;
		
		private var _ssView:ScreenshareView;
		
		private var _stageVideoInUse:Boolean = false;
		
		private var _classicVideoInUse:Boolean = false;
		
		private var _played:Boolean = false;
		
		private var originalVideoWidth:Number;
		
		private var originalVideoHeight:Number;
		
		private var _usingStageViewListener:Function;
		
		public function ScreenshareDock():void {
			
		}
		
		private function onStageVideoState(event:StageVideoAvailabilityEvent):void {
			var available:Boolean = (event.availability == StageVideoAvailability.AVAILABLE);
			
			available = false; // for testing!!!
			
			trace("************ ScreenshareView: STAGE VIDEO available=" + available);
			_usingStageViewListener(available);
			// Detect if StageVideo is available and decide what to do in toggleStageVideo 
			toggleStageVideo(available);
		}
		
		private function toggleStageVideo(on:Boolean):void {
			ns = new NetStream(_conn);
			ns.addEventListener(NetStatusEvent.NET_STATUS, onNetStatus);
			ns.addEventListener(AsyncErrorEvent.ASYNC_ERROR, onAsyncError);
			ns.client = this;
			ns.bufferTime = 0;
			ns.receiveVideo(true);
			ns.receiveAudio(false);
			
			trace("**** Container w=" + this.width + ",h=" + this.height + " video w=" + _width + ",h=" + _height);
			
			var viewPort:Rectangle = positionAndSize(this.width, this.height, _width, _height);
			
			// To choose StageVideo attach the NetStream to StageVideo 
			if (on) {
				
				_stageVideoInUse = true;
				if (_sv == null) {
					trace("***** Using StageVideo length=" + stage.stageVideos.length);
					_sv = stage.stageVideos[0];
					_sv.viewPort = viewPort;
					_sv.addEventListener(StageVideoEvent.RENDER_STATE, stageVideoStateChange);
					_sv.attachNetStream(ns);
				}
				
				if (_classicVideoInUse) {
					// If you use StageVideo, remove from the display list the 
					// Video object to avoid covering the StageVideo object 
					// (which is always in the background) 
					stage.removeChild(_ssView);
					_classicVideoInUse = false;
				}
			} else {
				// Otherwise attach it to a Video object 
				if (_stageVideoInUse) {
					_stageVideoInUse = false;
				}
				
				trace("***** Using classic Video");
				_ssView = new ScreenshareView();
				addElement(_ssView);
				//_ssView.percentWidth = 100;
				//_ssView.percentHeight = 100;
				_ssView.x = viewPort.x;
				_ssView.y = viewPort.y;
				_ssView.display(ns, viewPort.width, viewPort.width);
				_classicVideoInUse = true;
				//_ssView.fitToWindow();
			}
			
			if (!_played) {
				_played = true;
				trace("***** Playing stream " + _streamId);
				ns.play(_streamId);
			}
		}
		
		private function stageVideoStateChange(event:StageVideoEvent):void {
			var status:String = event.status;
			trace("***** stageVideoStateChange " + status + ",codec=" + event.codecInfo + ",color=" + event.colorSpace);
			resize();
		}
		
		private function resize():void {
			//var rc = computeVideoRect(_sv.videoWidth, _sv.videoHeight);       
			//_sv.viewPort = rc;       
		}
		
		public function viewStream(conn:NetConnection, streamId:String, width:int, height:int):void {
			trace("************ ScreenshareView: viewing of screenshare streamId=" + streamId + " w=" + width + " h=" + height);
			_conn = conn;
			_streamId = streamId;
			_width = width;
			_height = height;
			
			if (stage == null) {
				trace("************ ScreenshareView: STAGE IS NULL!!!!!!!!");
			} else {
				stage.addEventListener(StageVideoAvailabilityEvent.STAGE_VIDEO_AVAILABILITY, onStageVideoState);
			}
		}
		
		public function streamStopped(session:String, reason:String):void {
			trace("TODO: Need to implement stopping screenshare stream");
		}
		
		override protected function updateDisplayList(w:Number, h:Number):void {
			super.updateDisplayList(w, h);
		}
		
		private function onNetStatus(e:NetStatusEvent):void {
			switch (e.info.code) {
				case "NetStream.Publish.Start":
					//					trace("NetStream.Publish.Start for broadcast stream " + streamName);
					break;
				case "NetStream.Play.UnpublishNotify":
					//					close();
					break;
				case "NetStream.Play.Start":
					trace("Netstatus: " + e.info.code);
					invalidateDisplayList();
					break;
				case "NetStream.Play.FileStructureInvalid":
					trace("The MP4's file structure is invalid.");
					break;
				case "NetStream.Play.NoSupportedTrackFound":
					trace("The MP4 doesn't contain any supported tracks");
					break;
			}
		}
		
		private function onAsyncError(e:AsyncErrorEvent):void {
			trace("ScreenshareView::asyncerror " + e.toString());
		}
		
		public function onMetaData(info:Object):void {
			trace("ScreenshareView::ScreenshareView width={0} height={1}", [info.width, info.height]);
			if (_classicVideoInUse) {
				_ssView.width = info.width;
				_ssView.height = info.height;
			}
		}
		
		public function dispose():void {
			trace("************ ScreenshareView: dispose *********************");
			if (stage != null) {
				trace("************ ScreenshareView::dispose - remove listener ****************");
				stage.removeEventListener(StageVideoAvailabilityEvent.STAGE_VIDEO_AVAILABILITY, onStageVideoState);
			}
		}
		
		public function addUsingStageViewListener(listener:Function):void {
			_usingStageViewListener = listener;
		}
	
		private function positionAndSize(contWidth:int, contHeight:int, origVidWidth:int, origVidHeight:int):Rectangle {
			var newVidWidth:int;
			var newVidHeight:int;
			
			// if we have device where screen width less than screen height e.g. phone
			if (contWidth < contHeight) {
				// make the video width full width of the screen 
				newVidWidth = contWidth;
				// calculate height based on a video width, it order to keep the same aspect ratio
				newVidHeight = (newVidWidth / origVidWidth) * origVidHeight;
				// if calculated height appeared to be bigger than screen height, recalculuate the video size based on width
				if (contHeight < newVidHeight) {
					// make the video height full height of the screen
					newVidHeight = contHeight;
					// calculate width based on a video height, it order to keep the same aspect ratio
					newVidWidth = ((origVidWidth * newVidHeight) / origVidHeight);
				}
			} // if we have device where screen height less than screen width e.g. tablet
			else {
				// make the video height full height of the screen
				newVidHeight = contHeight;
				// calculate width based on a video height, it order to keep the same aspect ratio
				newVidWidth = ((origVidWidth * newVidHeight) / origVidHeight);
				// if calculated width appeared to be bigger than screen width, recalculuate the video size based on height
				if (contWidth < newVidWidth) {
					// make the video width full width of the screen 
					newVidWidth = contWidth;
					// calculate height based on a video width, it order to keep the same aspect ratio
					newVidHeight = (newVidWidth / origVidWidth) * origVidHeight;
				}
			}
			
			var x:int = (contWidth - newVidWidth) / 2;
			var y:int = (contHeight - newVidHeight) / 2;
			
			return new Rectangle(x, y, newVidWidth, newVidHeight);
		}
		
	}
}
