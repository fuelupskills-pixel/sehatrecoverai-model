def main():
    file_path = "static/dashboard.js"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    garbage = """,
      body: JSON.stringify({
        patientId: currentUser.healthId,
        fileName: name.endsWith('.pdf') ? name : `${name}.pdf`,
        category: category,
        fileSize: `${(1 + Math.random() * 4).toFixed(1)} MB`
      })
    });
    
    if (response.ok) {
      document.getElementById('doc-name-input').value = '';
      loadPatientDocuments();
      addAuditLogLine('success', `Document encrypted & added to ledger registry: ${name}`);
    }
  } catch (err) {
    console.error(err);
  }
}"""

    if garbage in content:
        content = content.replace(garbage, "")
        print("Garbage block removed successfully!")
    else:
        # Try to find with slightly different whitespace or let's search for a substring
        print("Warning: Exact garbage block not found!")
        # Let's search for the comma, body, and ledger registry text
        start_idx = content.find(",\n      body: JSON.stringify({\n        patientId: currentUser.healthId,\n        fileName: name.endsWith('.pdf') ? name : `${name}.pdf`")
        if start_idx != -1:
            end_idx = content.find("addAuditLogLine('success', `Document encrypted & added to ledger registry: ${name}`);\n    }\n  } catch (err) {\n    console.error(err);\n  }\n}")
            if end_idx != -1:
                garbage_full = content[start_idx:end_idx + len("addAuditLogLine('success', `Document encrypted & added to ledger registry: ${name}`);\n    }\n  } catch (err) {\n    console.error(err);\n  }\n}")]
                content = content.replace(garbage_full, "")
                print("Garbage block found and removed via indices!")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    main()
