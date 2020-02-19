package org.bigbluebutton.presentation.messages;

public class DocConversionStarted implements IDocConversionMsg {
    public final String podId;
    public final String meetingId;
    public final String presId;
    public final String filename;
    public final String authzToken;
    public final Boolean downloadable;
    public final Boolean current;
    public final Integer numPages;

    public DocConversionStarted(String podId,
                                String meetingId,
                                String presId,
                                String filename,
                                String authzToken,
                                Boolean downloadable,
                                Boolean current,
                                Integer numPages) {
        this.podId = podId;
        this.meetingId = meetingId;
        this.presId = presId;
        this.filename = filename;
        this.authzToken = authzToken;
        this.downloadable = downloadable;
        this.current = current;
        this.numPages = numPages;
    }
}
