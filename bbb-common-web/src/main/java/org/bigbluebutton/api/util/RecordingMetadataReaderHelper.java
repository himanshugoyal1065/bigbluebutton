package org.bigbluebutton.api.util;


import org.bigbluebutton.api.domain.RecordingMetadata;
import java.io.*;
import java.util.ArrayList;
import java.util.List;

import org.bigbluebutton.api2.RecordingServiceGW;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import scala.Option;

public class RecordingMetadataReaderHelper {
  private static Logger log = LoggerFactory.getLogger(RecordingMetadataReaderHelper.class);

  private RecordingServiceGW recordingServiceGW;

  public String getRecordingTextTracks(String recordId, ArrayList<File> recs) {
    return recordingServiceGW.getRecordingTextTracks(recordId, recs);
  }

  public String putRecordingTextTrack(String recordId, String kind, String lang, File file,
                                      String label, ArrayList<File> recs, String origFilename) {
    return recordingServiceGW.putRecordingTextTrack(recordId, kind, lang, file, label, recs);
  }

  public String getRecordings2x(ArrayList<RecordingMetadata> recs) {
    return recordingServiceGW.getRecordings2x(recs);
  }

  public RecordingMetadata getRecordingMetadata(File metadataXml) {

    RecordingMetadata recMeta = null;

    Option<RecordingMetadata> rm = recordingServiceGW.getRecordingMetadata(metadataXml);
    if (rm.isDefined()) {
      return rm.get();
    }

    return recMeta;
  }

  public File getMetadataXmlLocation(String destDir) {
    return new File(destDir + File.separatorChar + "metadata.xml");
  }

  public void saveRecordingMetadata(File metadataXml, RecordingMetadata recordingMetadata) {
    recordingServiceGW.saveRecordingMetadata(metadataXml, recordingMetadata);
  }

  public void setRecordingServiceGW(RecordingServiceGW recordingServiceGW) {
    this.recordingServiceGW = recordingServiceGW;
  }
}
