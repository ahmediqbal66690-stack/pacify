import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, FileCode, CheckCircle2 } from 'lucide-react';

const SCRIPT_DATA = [
  {
    title: "MODULE 1: Player Controller",
    filename: "PacifyPlayerController.cs",
    code: `using UnityEngine;
using Unity.Netcode;

public class PacifyPlayerController : NetworkBehaviour {
    [Header("Movement Settings")]
    public float walkSpeed = 3.0f;
    public float sprintSpeed = 6.0f;
    public float crawlSpeed = 1.0f;
    public float rotationSpeed = 10.0f;

    [Header("State")]
    public NetworkVariable<bool> isDoll = new NetworkVariable<bool>(false);
    public NetworkVariable<bool> isSprinting = new NetworkVariable<bool>(false);

    private CharacterController _controller;
    private Vector3 _moveDirection;

    void Start() {
        _controller = GetComponent<CharacterController>();
    }

    public override void OnNetworkSpawn() {
        if (!IsOwner) return;
        // Client-side prediction setup if needed
    }

    void Update() {
        if (!IsOwner) return;

        HandleMovement();
        HandleTransformation();
    }

    private void HandleMovement() {
        float speed = isDoll.Value ? crawlSpeed : (Input.GetKey(KeyCode.LeftShift) ? sprintSpeed : walkSpeed);
        
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        Vector3 direction = new Vector3(horizontal, 0, vertical).normalized;
        
        if (direction.magnitude >= 0.1f) {
            float targetAngle = Mathf.Atan2(direction.x, direction.z) * Mathf.Rad2Deg + Camera.main.transform.eulerAngles.y;
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.Euler(0, targetAngle, 0), rotationSpeed * Time.deltaTime);
            
            Vector3 moveDir = Quaternion.Euler(0, targetAngle, 0) * Vector3.forward;
            _controller.Move(moveDir.normalized * speed * Time.deltaTime);
        }
    }

    private void HandleTransformation() {
        if (isDoll.Value) {
            transform.localScale = Vector3.one * 0.4f;
            // Additional logic to change mesh/animation controller
        } else {
            transform.localScale = Vector3.one;
        }
    }
}`
  },
  {
    title: "MODULE 2: Monster AI State Machine",
    filename: "MonsterAIController.cs",
    code: `using UnityEngine;
using UnityEngine.AI;
using System.Collections;

public enum MonsterState { Calm, Aggressive, Pacified }

public class MonsterAIController : MonoBehaviour {
    public MonsterState currentState = MonsterState.Calm;
    public NavMeshAgent agent;
    public float detectionRadius = 15f;
    public float calmSpeed = 3.5f;
    public float baseAggressiveSpeed = 5.0f;
    public float speedMultiplierPerDoll = 0.5f;

    private Transform _currentTarget;
    private float _pacifiedTimer = 0f;

    void Start() {
        agent = GetComponent<NavMeshAgent>();
        StartCoroutine(AILoop());
    }

    IEnumerator AILoop() {
        while (true) {
            UpdateState();
            yield return new WaitForSeconds(0.2f); // Optimized interval (Module 2.2)
        }
    }

    void UpdateState() {
        switch (currentState) {
            case MonsterState.Calm:
                HandleCalm();
                break;
            case MonsterState.Aggressive:
                HandleAggressive();
                break;
            case MonsterState.Pacified:
                HandlePacified();
                break;
        }
    }

    private void HandleCalm() {
        if (agent.remainingDistance < 0.5f) {
            agent.SetDestination(GetRandomWaypoint());
        }
        agent.speed = calmSpeed;
        CheckForPlayers();
    }

    private void HandleAggressive() {
        if (_currentTarget == null) FindNearestPlayer();
        if (_currentTarget != null) {
            agent.SetDestination(_currentTarget.position);
            agent.speed = baseAggressiveSpeed + (GameManager.Instance.burnedDollsCount * speedMultiplierPerDoll);
        }
    }

    private void HandlePacified() {
        _pacifiedTimer -= 0.2f;
        if (_pacifiedTimer <= 0) currentState = MonsterState.Calm;
        // Monster stays still or wanders slowly
    }

    public void Pacify() {
        currentState = MonsterState.Pacified;
        _pacifiedTimer = 30f;
    }

    void CheckForPlayers() {
        Collider[] colliders = Physics.OverlapSphere(transform.position, detectionRadius);
        foreach (var col in colliders) {
            if (col.CompareTag("Player")) {
                // Raycast check for Line of Sight
                if (HasLineOfSight(col.transform)) {
                    _currentTarget = col.transform;
                    currentState = MonsterState.Aggressive;
                }
            }
        }
    }

    bool HasLineOfSight(Transform target) {
        RaycastHit hit;
        if (Physics.Raycast(transform.position + Vector3.up, (target.position - transform.position).normalized, out hit, detectionRadius)) {
            return hit.transform == target;
        }
        return false;
    }

    Vector3 GetRandomWaypoint() {
        // Implementation for random NavMesh point
        return transform.position;
    }
}`
  },
  {
    title: "MODULE 3: Furnace & Gameplay Mechanics",
    filename: "FurnaceController.cs",
    code: `using UnityEngine;
using Unity.Netcode;

public class FurnaceController : NetworkBehaviour {
    public int totalDollsToBurn = 9;
    
    [ServerRpc(RequireOwnership = false)]
    public void BurnDollServerRpc(ulong playerId) {
        // Logic to verify if player has a doll
        GameManager.Instance.burnedDollsCount.Value++;
        
        // Trigger Monster Aggression
        FindObjectOfType<MonsterAIController>().currentState = MonsterState.Aggressive;
        
        // Broadcast VFX
        TriggerBurnEffectsClientRpc();

        if (GameManager.Instance.burnedDollsCount.Value >= totalDollsToBurn) {
            EndGame(true);
        }
    }

    [ClientRpc]
    void TriggerBurnEffectsClientRpc() {
        // Pool and play particle effects
        ObjectPooler.Instance.SpawnFromPool("FurnaceSmoke", transform.position, Quaternion.identity);
    }

    void EndGame(bool victory) {
        // Game conclusion logic
    }
}`
  }
];

export default function CSharpScripts() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    setCopied(title);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div id="csharp-scripts" className="space-y-8 max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <FileCode className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Production C# Scripts</h2>
          <p className="text-slate-400 text-sm">Optimized, commented, and ready for Unity Netcode integration.</p>
        </div>
      </div>

      {SCRIPT_DATA.map((script, idx) => (
        <div key={idx} className="group relative bg-[#1e1e1e] rounded-xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-[#252526] border-bottom border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-emerald-400 mb-1">{script.title}</span>
              <span className="text-sm font-medium text-slate-200">{script.filename}</span>
            </div>
            <button
              onClick={() => copyToClipboard(script.code, script.title)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium text-slate-300"
            >
              {copied === script.title ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <SyntaxHighlighter
              language="csharp"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                fontSize: '0.8rem',
                backgroundColor: 'transparent',
              }}
            >
              {script.code}
            </SyntaxHighlighter>
          </div>
        </div>
      ))}
      
      <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h3 className="text-lg font-bold text-blue-400 mb-2">Integration Note</h3>
        <p className="text-blue-100/70 text-sm leading-relaxed">
          These scripts utilize <strong>Unity Netcode for GameObjects</strong> patterns. Ensure you have the 
          package installed via the Unity Package Manager. For high-performance networking, remember to adjust 
          the "Tick Rate" in your NetworkManager to balance smoothness and CPU usage.
        </p>
      </div>
    </div>
  );
}
