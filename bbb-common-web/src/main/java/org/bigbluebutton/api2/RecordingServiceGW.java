package org.bigbluebutton.api2;

import org.bigbluebutton.api.domain.RecordingMetadata;
import scala.Option;
import java.io.File;
import java.util.ArrayList;

public interface RecordingServiceGW {

  String getRecordings2x(ArrayList<RecordingMetadata> recs);
  Option<RecordingMetadata> getRecordingMetadata(File xml);
  void saveRecordingMetadata(File xml, RecordingMetadata metadata);
  String getRecordingTextTracks(String recordId, ArrayList<File> file);
  String putRecordingTextTrack(String recordId, String kind, String lang, File file, String label,
                               ArrayList<File> recs, String origFilename);
}
