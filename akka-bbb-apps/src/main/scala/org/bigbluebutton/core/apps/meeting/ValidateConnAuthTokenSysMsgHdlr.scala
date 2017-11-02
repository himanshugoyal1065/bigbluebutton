package org.bigbluebutton.core.apps.meeting

import org.bigbluebutton.common2.msgs.ValidateConnAuthTokenSysMsg
import org.bigbluebutton.core.models.RegisteredUsers
import org.bigbluebutton.core.running.{ LiveMeeting, OutMsgRouter }
import org.bigbluebutton.core2.message.senders.MsgBuilder

trait ValidateConnAuthTokenSysMsgHdlr {
  val liveMeeting: LiveMeeting
  val outGW: OutMsgRouter

  def handleValidateConnAuthTokenSysMsg(msg: ValidateConnAuthTokenSysMsg): Unit = {

    println("******************** RECEIVED ValidateConnAuthTokenSysMsg")

    val regUser = RegisteredUsers.getRegisteredUserWithToken(
      msg.body.authToken,
      msg.body.userId,
      liveMeeting.registeredUsers
    )

    regUser match {
      case Some(u) =>
        val event = MsgBuilder.buildValidateConnAuthTokenSysRespMsg(msg.body.meetingId, msg.body.userId,
          msg.body.authToken, true, msg.body.conn)
        outGW.send(event)
      case None =>
        val event = MsgBuilder.buildValidateConnAuthTokenSysRespMsg(msg.body.meetingId, msg.body.userId,
          msg.body.authToken, false, msg.body.conn)
        outGW.send(event)
    }
  }
}
