import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";

actor {
  type Label = {
    #spam;
    #ham;
  };

  type ClassificationRecord = {
    id : Nat;
    message : Text;
    classificationLabel : Label;
    confidence : Float;
    timestamp : Int;
  };

  module ClassificationRecord {
    public func compareByTimestamp(a : ClassificationRecord, b : ClassificationRecord) : Order.Order {
      Int.compare(b.timestamp, a.timestamp);
    };
  };

  var nextId = 1;

  let records = Map.empty<Nat, ClassificationRecord>();

  func addRecordInternal(record : ClassificationRecord) {
    records.add(record.id, record);
  };

  public shared ({ caller }) func addRecord(message : Text, classificationLabel : Label, confidence : Float) : async () {
    let record : ClassificationRecord = {
      id = nextId;
      message;
      classificationLabel;
      confidence;
      timestamp = Time.now();
    };
    addRecordInternal(record);
    nextId += 1;
  };

  public query ({ caller }) func getAllRecords() : async [ClassificationRecord] {
    records.values().toArray().sort(ClassificationRecord.compareByTimestamp);
  };

  public shared ({ caller }) func clearHistory() : async () {
    records.clear();
  };

  public shared ({ caller }) func seedDemoData() : async () {
    let demoRecords = [
      {
        id = nextId;
        message = "Congratulations! You've won a free ticket.";
        classificationLabel = #spam;
        confidence = 0.95;
        timestamp = 1_657_751_046_000_000_000;
      },
      {
        id = nextId + 1;
        message = "Hey, are we still meeting today?";
        classificationLabel = #ham;
        confidence = 0.98;
        timestamp = 1_657_751_047_000_000_000;
      },
      {
        id = nextId + 2;
        message = "Urgent! Your account has been compromised.";
        classificationLabel = #spam;
        confidence = 0.92;
        timestamp = 1_657_751_048_000_000_000;
      },
    ];

    for (record in demoRecords.values()) {
      addRecordInternal(record);
      nextId += 1;
    };
  };
};
