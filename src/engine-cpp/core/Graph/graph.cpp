#include <iostream>
#include <string>
#include <map>
#include <vector>

using namespace std;

class GraphManager
{
private:
    string id;
    map<string, string> Nodes;
    map<string, vector<string>> Edges;
    map<string, vector<string>> IncomingEdges;
    map<string, vector<string>> OutgoingEdges;
    map<string, vector<string>> DataNodes;

public:
    GraphManager(string id)
    {
        this->id = id;
    }

    void addNode(string id, string name)
    {
        Nodes[id] = name;
    }

    void addEdge(string from, string to, string fromDataType, string toDataType)
    {
        this->OutgoingEdges[from].push_back(to);
        this->IncomingEdges[to].push_back(from);

        this->DataNodes[fromDataType].push_back(from);
        this->DataNodes[toDataType].push_back(to);

        this->Edges[from].push_back(to);
    }

    vector<string> getNextNodes(string from)
    {
        if (this->Edges.find(from) == this->Edges.end())
        {
            return vector<string>();
        }

        return this->Edges[from];
    }

    NodeDetails getDetails()
    {
        return {
            this->Nodes,
            this->Edges,
        };
    }
};

struct NodeDetails
{
    map<string, string> Nodes;
    map<string, vector<string>> Edges;
};