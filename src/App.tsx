import { useEffect, useState, useRef } from "react";
import "./App.css";
import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

interface Plant {
  Name: string;
  ImageURL: string;
  Watered: string;
  Repotted: string;
  Fertilized: string;
}

function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newWatered, setNewWatered] = useState<Date | null>(null);
  const [newRepotted, setNewRepotted] = useState<Date | null>(null);
  const [newFertilized, setNewFertilized] = useState<Date | null>(null);
  const [newImageURL, setNewImageURL] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const dynamoDBClient = new DynamoDBClient({
    region: import.meta.env.AWS_REGION!,
    credentials: {
      accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  useEffect(() => {
    const params = {
      TableName: "plants",
    };

    dynamoDBClient!
      .send(new ScanCommand(params))
      .then((data) => {
        if (data.Items) {
          const plantItems: Plant[] = data.Items.map((item) => ({
            Name: item.Name.S || "",
            ImageURL: item.ImageURL.S || "",
            Watered: item.Watered.S || "",
            Repotted: item.Repotted.S || "",
            Fertilized: item.Fertilized.S || "",
          }));
          setPlants(plantItems);
        }
      })
      .catch((error) => {
        console.error("Unable to scan items. Error:", error);
      });

    // Add event listener to handle clicks outside the modal
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        closeModal();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const renderPlants = () => {
    const handleWaterButtonClick = (plant: Plant) => {
      const today = new Date().toISOString().split("T")[0];

      const params = {
        TableName: "plants",
        Key: {
          Name: { S: plant.Name }, // Assuming Name is the primary key
        },
        UpdateExpression: "SET Watered = :watered",
        ExpressionAttributeValues: {
          ":watered": { S: today },
        },
      };

      dynamoDBClient!
        .send(new UpdateItemCommand(params))
        .then(() => {
          // Refresh the plants list after updating
          const updatedPlants = plants.map((p) => {
            if (p.Name === plant.Name) {
              return { ...p, Watered: today };
            }
            return p;
          });
          setPlants(updatedPlants);
        })
        .catch((error) => {
          console.error("Unable to update item. Error:", error);
        });
    };

    const handleRepotButtonClick = (plant: Plant) => {
      const today = new Date().toISOString().split("T")[0];

      const params = {
        TableName: "plants",
        Key: {
          Name: { S: plant.Name }, // Assuming Name is the primary key
        },
        UpdateExpression: "SET Repotted = :repotted",
        ExpressionAttributeValues: {
          ":repotted": { S: today },
        },
      };

      dynamoDBClient!
        .send(new UpdateItemCommand(params))
        .then(() => {
          // Refresh the plants list after updating
          const updatedPlants = plants.map((p) => {
            if (p.Name === plant.Name) {
              return { ...p, Repotted: today };
            }
            return p;
          });
          setPlants(updatedPlants);
        })
        .catch((error) => {
          console.error("Unable to update item. Error:", error);
        });
    };

    const handleFertilizeButtonClick = (plant: Plant) => {
      const today = new Date().toISOString().split("T")[0];

      const params = {
        TableName: "plants",
        Key: {
          Name: { S: plant.Name }, // Assuming Name is the primary key
        },
        UpdateExpression: "SET Fertilized = :fertilized",
        ExpressionAttributeValues: {
          ":fertilized": { S: today },
        },
      };

      dynamoDBClient!
        .send(new UpdateItemCommand(params))
        .then(() => {
          // Refresh the plants list after updating
          const updatedPlants = plants.map((p) => {
            if (p.Name === plant.Name) {
              return { ...p, Fertilized: today };
            }
            return p;
          });
          setPlants(updatedPlants);
        })
        .catch((error) => {
          console.error("Unable to update item. Error:", error);
        });
    };

    return (
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-black">
          {plants.map((plant, index) => {
            const { Name, ImageURL, Watered, Repotted, Fertilized } = plant;
            const wateredDate = parseDate(Watered);
            const repottedDate = parseDate(Repotted);
            const fertilizedDate = parseDate(Fertilized);
            const currentDate = new Date();

            const wateredDaysAgo = Math.floor(
              (currentDate.getTime() - wateredDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const repottedDaysAgo = Math.floor(
              (currentDate.getTime() - repottedDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            const fertilizedDaysAgo = Math.floor(
              (currentDate.getTime() - fertilizedDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            let wateredColorClass = "";
            if (wateredDaysAgo >= 0 && wateredDaysAgo <= 4) {
              wateredColorClass = "text-green-500";
            } else if (wateredDaysAgo >= 5 && wateredDaysAgo <= 7) {
              wateredColorClass = "text-yellow-500";
            } else {
              wateredColorClass = "text-red-500";
            }

            return (
              <div key={index} className="bg-white shadow-md rounded-md p-4">
                <img src={ImageURL} alt={Name} className="w-full h-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">{Name}</h2>
                <p className={wateredColorClass}>
                  Watered {wateredDaysAgo} days ago
                </p>
                <p>Repotted {repottedDaysAgo} days ago</p>
                <p>Fertilized {fertilizedDaysAgo} days ago</p>
                <button
                  className="text-white"
                  onClick={() => handleWaterButtonClick(plant)}
                >
                  Water
                </button>
                <button
                  className="text-white"
                  onClick={() => handleRepotButtonClick(plant)}
                >
                  Repot
                </button>
                <button
                  className="text-white"
                  onClick={() => handleFertilizeButtonClick(plant)}
                >
                  Fertilize
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const parseDate = (dateString: string): Date => {
    try {
      const [day, month, year] = dateString
        .split("T")[0]
        .split(".")
        .map(Number);
      const [hours, minutes] = dateString.split("T")[1].split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } catch (error) {
      return new Date(); // Return current date as fallback
    }
  };

  const parseDateToFormat = (date: Date | null): string => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}.${month}.${year}T${hours}:${minutes}`;
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewPlantName("");
    setNewWatered(null);
    setNewRepotted(null);
    setNewFertilized(null);
  };

  const handleSubmit = () => {
    const params = {
      TableName: "plants",
      Item: {
        Name: { S: newPlantName },
        Watered: { S: parseDateToFormat(newWatered) },
        Repotted: { S: parseDateToFormat(newRepotted) },
        Fertilized: { S: parseDateToFormat(newFertilized) },
        ImageURL: { S: newImageURL },
      },
    };

    dynamoDBClient!
      .send(new PutItemCommand(params))
      .then(() => {
        console.log("PutItem succeeded");
        closeModal();
      })
      .catch((error) => {
        console.error("Unable to add item. Error:", error);
      });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center">
        <img src="./plant.svg" alt="" className="h-8 mr-2" />
        <h1>Plantera</h1>
      </div>
      <button className="mt-5" onClick={openModal}>
        Add Plant
      </button>
      <div className="mt-5">{renderPlants()}</div>

      {/* Modal */}
      {modalOpen && (
        <div
          className={`modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center`}
        >
          <div className="modal bg-black w-96 p-8 rounded-lg" ref={modalRef}>
            <button
              className="close absolute top-0 right-0 p-4 cursor-pointer"
              onClick={closeModal}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-500 hover:text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold mb-4">Add New Plant</h2>
            <form onSubmit={handleSubmit} className="bg-black">
              <label className="block mb-4">
                Name:
                <input
                  type="text"
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md p-2 bg-white text-black"
                />
              </label>
              <label className="block mb-4">
                Watered:
                <input
                  type="date"
                  value={
                    newWatered ? newWatered.toISOString().split("T")[0] : ""
                  }
                  onChange={(e) => setNewWatered(new Date(e.target.value))}
                  className="block w-full border border-gray-300 rounded-md p-2 bg-white text-black"
                />
              </label>
              <label className="block mb-4">
                Repotted:
                <input
                  type="date"
                  value={
                    newRepotted ? newRepotted.toISOString().split("T")[0] : ""
                  }
                  onChange={(e) => setNewRepotted(new Date(e.target.value))}
                  className="block w-full border border-gray-300 rounded-md p-2 bg-white text-black"
                />
              </label>
              <label className="block mb-4">
                Fertilized:
                <input
                  type="date"
                  value={
                    newFertilized
                      ? newFertilized.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => setNewFertilized(new Date(e.target.value))}
                  className="block w-full border border-gray-300 rounded-md p-2 bg-white text-black"
                />
              </label>
              <label className="block mb-4">
                Image URL:
                <input
                  type="text"
                  value={newImageURL}
                  onChange={(e) => setNewImageURL(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md p-2 bg-white text-black"
                />
              </label>
              <button
                type="submit"
                className="bg-blue-500 text-white rounded-md py-2 px-4 hover:bg-blue-600"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
